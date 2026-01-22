<?php

namespace App\Action\Pharmacy\Inventory;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Action\Pharmacy\Inventory\InventoryItemCreate;
use App\Action\Pharmacy\Inventory\InventoryStockTransaction;

class CreatePharmacyInventoryStock
{
    public function __invoke(array $request): array
    {
        DB::beginTransaction();
        try {
            $inventoryItem = InventoryItemCreate::execute($request);

            InventoryStockTransaction::execute($inventoryItem, $request);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Inventory item added successfully');
        } catch (\Exception $e) {
            Log::error('Pharmacy Inventory Create Error: ', ['error' => $e->getMessage()]);
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
