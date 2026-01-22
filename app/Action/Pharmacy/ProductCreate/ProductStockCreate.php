<?php

namespace App\Action\Pharmacy\ProductCreate;

use Illuminate\Support\Str;
use App\Models\Pharmacy\ProductStock;

class ProductStockCreate
{
    public static function execute(array $request, string $productId): void
    {
        ProductStock::create([
            'id' => Str::uuid(),
            'product_id' => $productId,
            'unit' => $request['unit'],
            'current_stock' => $request['current_stock'],
            'min_stock' => $request['min_stock'],
            'reorder_level' => $request['reorder_level'],
            'reorder_quantity' => $request['reorder_quantity'],
            'unit_cost' => $request['unit_cost'],
            'unit_selling_price' => $request['unit_selling_price'],
            'expiry_date' => $request['expiry_date'],
            'entry_date' => $request['entry_date'],
            'stock_status' => $request['stock_status'],
            'product_store_location' => $request['product_store_location'],
            'stock_update_date' => $request['stock_update_date'],
            'damaged_stock' => $request['damaged_stock'] ?? null,
        ]);
    }
}
