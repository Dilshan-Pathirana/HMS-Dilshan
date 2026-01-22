<?php

namespace App\Action\Pharmacy\Supplier;

use App\Response\CommonResponse;
use App\Models\Pharmacy\Supplier;
use Illuminate\Support\Facades\Log;

class SupplierDelete
{
    public function __invoke(string $supplierId): array
    {
        try {
            $supplier = Supplier::find($supplierId);

            if (! $supplier) {
                return CommonResponse::sendBadResponse();
            }

            $supplier->delete();

            return CommonResponse::sendSuccessResponse('Supplier deleted successfully');
        } catch (\Exception $e) {
            Log::error('DeleteSupplier Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
