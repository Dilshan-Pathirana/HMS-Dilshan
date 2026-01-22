<?php

namespace App\Action\Pharmacy\ProductStock\ProductStockUpdate;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\Services\ProductStockManagement;

class ProductStockUpdate
{
    public function __invoke(array $productStockData): array
    {
        DB::beginTransaction();

        try {
            $productStockManagement = new ProductStockManagement($productStockData['product_id']);
            $productStockManagement->updateProductStock($productStockData['new_added_stock']);

            $this->applyOptionalUpdates($productStockManagement, $productStockData);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Product stock updated successfully');
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }

    protected function applyOptionalUpdates(ProductStockManagement $manager, array $productStockData): void
    {
        $updates = [
            'new_selling_unit_price' => 'updateProductUnitSellingPrice',
            'new_expiry_date'      => 'updateProductExpireDate',
            'new_entry_date'       => 'updateProductEntryDate',
        ];

        foreach ($updates as $field => $method) {
            if (! empty($productStockData[$field])) {
                $manager->{$method}($productStockData[$field]);
            }
        }
    }
}
