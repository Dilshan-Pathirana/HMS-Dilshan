<?php

namespace App\Action\Pharmacy\ProductStock\ProductStockUpdate;

use App\Response\CommonResponse;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\Services\GetProductStockEventDetails;

class GetProductTransferStock
{
    public function __invoke(): array
    {
        $productTransferStockEventDetails = GetProductStockEventDetails::execute(3);

        if ($productTransferStockEventDetails->isEmpty()) {
            return CommonResponse::sendBadResponse();
        }

        return CommonResponse::sendSuccessResponseWithData('product_stock_event', $productTransferStockEventDetails);
    }
}
