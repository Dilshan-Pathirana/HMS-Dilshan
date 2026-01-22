<?php

namespace App\Action\Pharmacy\Product;

use App\Models\Pharmacy\Product;

class GetAllProductItemNameAndCode
{
    public function __invoke(): array
    {
        $productNames = Product::all()->pluck('item_name')->toArray();
        $productCodes = Product::all()->pluck('item_code')->toArray();

        return [
            'product_names' => $productNames,
            'product_codes' => $productCodes,
        ];
    }
}
