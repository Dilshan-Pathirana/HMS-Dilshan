<?php

namespace App\Action\Pharmacy\Product;

use App\Response\CommonResponse;
use App\Models\Pharmacy\ProductDiscount;

class DeleteProductDiscount
{
    public function __invoke(string $productId): array
    {
        $productDiscount = ProductDiscount::where('id', $productId)->first();
        if ($productDiscount) {
            $productDiscount->delete();

            return CommonResponse::sendSuccessResponse('Discount deleted successfully');
        }

        return CommonResponse::sendBadResponseWithMessage('Discount not found');
    }
}
