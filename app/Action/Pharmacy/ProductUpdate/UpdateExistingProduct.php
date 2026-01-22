<?php

namespace App\Action\Pharmacy\ProductUpdate;

use App\Models\Pharmacy\Product;
use App\Response\CommonResponse;
use App\Models\Pharmacy\Warranty;
use Illuminate\Support\Facades\Log;
use App\Models\Pharmacy\ProductStock;

class UpdateExistingProduct
{
    public function __invoke(
        string $productId,
        array $validatedProductUpdateRequest
    ): array {
        try {
            $product = Product::find($productId);

            if (! $product) {
                return CommonResponse::sendBadResponse();
            }

            $product->update([
                'item_code' => $validatedProductUpdateRequest['item_code'] ?? $product->item_code,
                'barcode' => $validatedProductUpdateRequest['barcode'] ?? $product->barcode,
                'supplier_id' => $validatedProductUpdateRequest['supplier_id'] ?? $product->supplier_id,
                'item_name' => $validatedProductUpdateRequest['item_name'] ?? $product->item_name,
                'generic_name' => $validatedProductUpdateRequest['generic_name'] ?? $product->generic_name,
                'brand_name' => $validatedProductUpdateRequest['brand_name'] ?? $product->brand_name,
                'category' => $validatedProductUpdateRequest['category'] ?? $product->category,
            ]);

            $productStock = ProductStock::where('product_id', $productId)->first();
            if ($productStock) {
                $productStock->update([
                    'unit' => $validatedProductUpdateRequest['unit'] ?? $productStock->unit,
                    'current_stock' => $validatedProductUpdateRequest['current_stock'] ?? $productStock->current_stock,
                    'min_stock' => $validatedProductUpdateRequest['min_stock'] ?? $productStock->min_stock,
                    'reorder_level' => $validatedProductUpdateRequest['reorder_level'] ?? $productStock->reorder_level,
                    'reorder_quantity' => $validatedProductUpdateRequest['reorder_quantity'] ?? $productStock->reorder_quantity,
                    'unit_cost' => $validatedProductUpdateRequest['unit_cost'] ?? $productStock->unit_cost,
                    'unit_selling_price' => $validatedProductUpdateRequest['unit_selling_price'] ?? $productStock->unit_selling_price,
                    'expiry_date' => $validatedProductUpdateRequest['expiry_date'] ?? $productStock->expiry_date,
                    'entry_date' => $validatedProductUpdateRequest['entry_date'] ?? $productStock->entry_date,
                    'stock_status' => $validatedProductUpdateRequest['stock_status'] ?? $productStock->stock_status,
                    'product_store_location' => $validatedProductUpdateRequest['product_store_location'] ?? $productStock->product_store_location,
                    'stock_update_date' => $validatedProductUpdateRequest['stock_update_date'] ?? $productStock->stock_update_date,
                    'damaged_stock' => $validatedProductUpdateRequest['damaged_stock'] ?? $productStock->damaged_stock,
                ]);
            } else {
                return CommonResponse::sendBadResponse();
            }

            $warranty = Warranty::where('product_id', $productId)->first();
            if ($warranty) {
                $warranty->update([
                    'supplier_id' => $validatedProductUpdateRequest['supplier_id'] ?? $warranty->supplier_id,
                    'warranty_serial' => $validatedProductUpdateRequest['warranty_serial'] ?? $warranty->warranty_serial,
                    'warranty_duration' => $validatedProductUpdateRequest['warranty_duration'] ?? $warranty->warranty_duration,
                    'warranty_start_date' => $validatedProductUpdateRequest['warranty_start_date'] ?? $warranty->warranty_start_date,
                    'warranty_end_date' => $validatedProductUpdateRequest['warranty_end_date'] ?? $warranty->warranty_end_date,
                    'warranty_type' => $validatedProductUpdateRequest['warranty_type'] ?? $warranty->warranty_type,
                ]);
            } else {
                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponse('Product updated successfully');
        } catch (\Exception $e) {
            Log::error('UpdateProduct Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
