<?php

namespace App\Action\Pharmacy\ProductStock\ProductStockUpdate;

use App\Response\CommonResponse;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\Services\GetProductStockEventDetails;

class GetProductDamagedStock
{
    public function __invoke(): array
    {
        $productDamagedStockEventDetails = GetProductStockEventDetails::execute(2);

        if ($productDamagedStockEventDetails->isEmpty()) {
            return CommonResponse::sendBadResponse();
        }

        return CommonResponse::sendSuccessResponseWithData('product_stock_event', $productDamagedStockEventDetails);
    }
}
