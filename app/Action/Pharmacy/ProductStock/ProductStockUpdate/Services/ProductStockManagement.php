<?php

namespace App\Action\Pharmacy\ProductStock\ProductStockUpdate\Services;

use Exception;
use Illuminate\Support\Str;
use App\Models\Pharmacy\Product;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Pharmacy\ProductStock;
use App\Models\Pharmacy\ProductEventDetails;
use App\Events\ProductStockLimitationReminder;

class ProductStockManagement
{
    public ProductStock $productStock;

    private Product $product;
    private string $productId;
    private float $productPreviousStock;

    public array $productEventDetails = [
        1 => 'Product stock updated',
        2 => 'Product stock damaged',
        3 => 'Product stock transferred',
        4 => 'product purchase',
    ];

    public function __construct(string $productId)
    {
        $this->productStock = ProductStock::where('product_id', $productId)->first();
        $this->product = Product::where('id', $productId)->first();
        $this->productId = $productId;
        $this->productPreviousStock = $this->productStock->current_stock;
    }

    private function getProductCurrentStock(): float
    {
        return $this->productStock->current_stock;
    }

    public function updateProductStock(float $newStock): void
    {
        $this->productStock->current_stock += $newStock;
        $this->productStock->update();
        $this->createStockUpdateEvent($newStock, 1, $this->productEventDetails[1]);
    }

    public function updateProductUnitSellingPrice(float $newSellingPrice): void
    {
        $this->productStock->unit_selling_price = $newSellingPrice;
        $this->productStock->update();
    }

    public function updateProductExpireDate(string $newExpiryDate): void
    {
        $this->productStock->expiry_date = $newExpiryDate;
        $this->productStock->update();
    }

    public function updateProductEntryDate(string $newEntryDate): void
    {
        $this->productStock->entry_date = $newEntryDate;
        $this->productStock->update();
    }

    public function reduceProductStock(
        float $reduceProductStock,
        int $eventType,
        string $eventReason
    ): void {
        $this->productStock->current_stock -= $reduceProductStock;
        $this->productStock->update();
        $this->createStockUpdateEvent($reduceProductStock, $eventType, $eventReason);
        $this->checkProductStockReachReorderLevel($this->productStock->current_stock);
    }

    private function createStockUpdateEvent(float $changedStockAmount, int $eventReasonType, string $eventReason): void
    {
        ProductEventDetails::create([
            'id' => Str::uuid(),
            'product_id' => $this->productId,
            'user_id' => Auth::user()->id,
            'previous_stock' => $this->productPreviousStock,
            'stock_related_to_event' => $changedStockAmount,
            'current_stock' => $this->getProductCurrentStock(),
            'event_reason' => $eventReason,
            'event_type' => $eventReasonType,
        ]);
    }

    private function checkProductStockReachReorderLevel(int $currentStock): void
    {
        if ($currentStock < $this->productStock->reorder_level) {
            try {
                broadcast(new ProductStockLimitationReminder($this->product->item_name))->toOthers();
            } catch (Exception $e) {
                Log::error($e->getMessage());
            }
        }
    }
}
