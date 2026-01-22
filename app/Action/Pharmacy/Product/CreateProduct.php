<?php

namespace App\Action\Pharmacy\Product;

use App\Response\CommonResponse;
use App\Models\Pharmacy\Supplier;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Action\Pharmacy\ProductCreate\ProductCreate;
use App\Action\Pharmacy\ProductCreate\WarrantyCreate;
use App\Action\Pharmacy\ProductCreate\ProductStockCreate;
use App\Action\Pharmacy\ProductCreate\SyncProductToAllPharmacies;

class CreateProduct
{
    public function __invoke(array $request): array
    {
        DB::beginTransaction();
        try {
            if (! isset($request['supplier_id'])) {
                return CommonResponse::sendBadResponse();
            }

            $supplierExists = Supplier::find($request['supplier_id']);
            if (! $supplierExists) {
                return CommonResponse::sendBadResponse();
            }

            $productId = ProductCreate::execute($request);

            if ($productId) {
                ProductStockCreate::execute($request, $productId);
                WarrantyCreate::execute($request, $productId, $request['supplier_id']);
                
                // Sync product to all pharmacy inventories
                // Only syncs base product info, not pharmacy-specific fields
                $syncedCount = SyncProductToAllPharmacies::execute($request, $productId);
                Log::info("Product synced to {$syncedCount} pharmacies");
            }

            DB::commit();

            return CommonResponse::sendSuccessResponse('Product created and synced to all pharmacies successfully');
        } catch (\Exception $e) {
            Log::error('CreateProduct Error: '.$e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
