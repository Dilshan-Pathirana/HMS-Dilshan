<?php

namespace App\Action\Pharmacy;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Action\Pharmacy\PurchasingCreate\BillCreate;
use App\Action\Pharmacy\PurchasingCreate\PurchaseProduct;

class CreatePurchasing
{
    public function __invoke(array $request): array
    {
        DB::beginTransaction();
        try {
            $billId = BillCreate::execute($request);

            PurchaseProduct::execute($request['products'], $billId);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Purchase successfully');
        } catch (\Exception $e) {
            Log::error('Purchasing error: ', ['error' => $e->getMessage()]);
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
