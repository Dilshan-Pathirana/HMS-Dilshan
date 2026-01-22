<?php

namespace App\Action\Pharmacy\Product;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetAllProductDiscountDetails
{
    public function __invoke(): array
    {
        $productDiscounts = DB::table('product_discount')
            ->join('products', 'products.id', '=', 'product_discount.product_id')
            ->select([
            'product_discount.id',
            'product_discount.product_id',
            'product_discount.discount_type',
            'product_discount.discount_amount',
            'product_discount.discount_percentage',
            'products.item_name',
            'products.item_code',
            'products.barcode',
        ])->get();

        return CommonResponse::sendSuccessResponseWithData('products_discounts', $productDiscounts);
    }
}
