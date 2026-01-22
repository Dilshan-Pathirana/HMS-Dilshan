<?php

namespace App\Action\Pharmacy\ProductCreate;

use Illuminate\Support\Str;
use App\Models\Pharmacy\Warranty;

class WarrantyCreate
{
    public static function execute(array $request, string $productId): void
    {
        Warranty::create([
            'id' => Str::uuid(),
            'product_id' => $productId,
            'supplier_id' => $request['supplier_id'],
            'warranty_serial' => $request['warranty_serial'],
            'warranty_duration' => $request['warranty_duration'],
            'warranty_start_date' => $request['warranty_start_date'],
            'warranty_end_date' => $request['warranty_end_date'],
            'warranty_type' => $request['warranty_type'],
        ]);
    }
}
