<?php

namespace App\Action\Pharmacy\ProductStock\ProductStockUpdate;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\Services\ProductStockManagement;

class ProductDamagedStockReduce
{
    public function __invoke(array $validatedRequest): array
    {
        DB::beginTransaction();
        try {
            $productStockManagement = (new ProductStockManagement($validatedRequest['product_id']));
            $productStockManagement->reduceProductStock(
                $validatedRequest['damaged_stock'],
                2,
                $validatedRequest['event_reason']
            );

            DB::commit();

            return CommonResponse::sendSuccessResponse('Product stock updated successfully');
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
