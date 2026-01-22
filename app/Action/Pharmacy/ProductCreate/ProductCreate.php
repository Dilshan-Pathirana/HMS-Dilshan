<?php

namespace App\Action\Pharmacy\ProductCreate;

use Illuminate\Support\Str;
use App\Models\Pharmacy\Product;

class ProductCreate
{
    public static function execute(array $request): string
    {
        $product = Product::create([
            'id' => Str::uuid(),
            'supplier_id' => $request['supplier_id'],
            'item_code' => $request['item_code'],
            'barcode' => $request['barcode'],
            'item_name' => $request['item_name'],
            'generic_name' => $request['generic_name'],
            'brand_name' => $request['brand_name'],
            'category' => $request['category'],
        ]);

        return $product->id;
    }
}
