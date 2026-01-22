<?php

namespace App\Action\Pharmacy\ProductStock\ProductStockUpdate;

use App\Response\CommonResponse;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\Services\GetProductStockEventDetails;

class GetProductRenewStock
{
    public function __invoke(): array
    {
        $productRenewStockEventDetails = GetProductStockEventDetails::execute(1);

        if ($productRenewStockEventDetails->isEmpty()) {
            return CommonResponse::sendBadResponse();
        }

        return CommonResponse::sendSuccessResponseWithData('product_stock_event', $productRenewStockEventDetails);
    }
}
