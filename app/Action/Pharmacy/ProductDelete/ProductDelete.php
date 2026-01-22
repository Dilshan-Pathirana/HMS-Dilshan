<?php

namespace App\Action\Pharmacy\ProductDelete;

use App\Models\Pharmacy\Product;
use App\Response\CommonResponse;
use App\Models\Pharmacy\Warranty;
use App\Models\Pharmacy\ProductStock;

class ProductDelete
{
    public function __invoke(string $productId): array
    {
        $product = Product::find($productId);

        if (! $product) {
            return CommonResponse::sendBadResponse();
        }

        Warranty::where('product_id', $productId)->delete();
        ProductStock::where('product_id', $productId)->delete();

        $product->delete();

        return CommonResponse::sendSuccessResponse('Product deleted successfully');
    }
}
