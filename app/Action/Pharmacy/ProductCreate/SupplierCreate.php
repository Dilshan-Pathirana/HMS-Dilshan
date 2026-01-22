<?php

namespace App\Action\Pharmacy\ProductCreate;

use Illuminate\Support\Str;
use App\Models\Pharmacy\Supplier;

class SupplierCreate
{
    public static function execute(array $request, string $productId): string
    {
        $supplier = Supplier::create([
            'id' => Str::uuid(),
            'product_id' => $productId,
            'supplier_name' => $request['supplier_name'],
            'contact_person' => $request['contact_person'],
            'contact_number' => $request['contact_number'],
            'contact_email' => $request['contact_email'],
            'supplier_address' => $request['supplier_address'],
            'supplier_city' => $request['supplier_city'],
            'supplier_country' => $request['supplier_country'],
            'delivery_time' => $request['delivery_time'],
            'payment_terms' => $request['payment_terms'],
            'bank_details' => $request['bank_details'],
            'note' => $request['note'],
        ]);

        return $supplier->id;
    }
}
