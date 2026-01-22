<?php

namespace App\Action\Supplier;

use App\Response\CommonResponse;
use App\Models\Pharmacy\Supplier;
use Illuminate\Support\Facades\DB;

class CreateSupplier
{
    public function __invoke(array $request): array
    {
        return DB::transaction(function () use ($request) {
            Supplier::create([
                 'supplier_name' => $request['supplier_name'],
                 'contact_person' => $request['contact_person'],
                 'contact_number' => $request['contact_number'],
                 'contact_email' => $request['contact_email'],
                 'supplier_address' => $request['supplier_address'],
                 'supplier_city' => $request['supplier_city'],
                 'supplier_country' => $request['supplier_country'],
                 'supplier_type' => $request['supplier_type'],
                 'products_supplied' => $request['products_supplied'],
                 'rating' => $request['rating'],
                 'discounts_agreements' => $request['discounts_agreements'],
                 'return_policy' => $request['return_policy'],
                 'delivery_time' => $request['delivery_time'],
                 'payment_terms' => $request['payment_terms'],
                 'bank_details' => $request['bank_details'],
                 'note' => $request['note'],
             ]);

            return CommonResponse::sendSuccessResponse('Supplier Created Successfully!');
        });
    }
}
