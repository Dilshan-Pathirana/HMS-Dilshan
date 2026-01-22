<?php

namespace App\Action\Pharmacy\Supplier;

use App\Response\CommonResponse;
use App\Models\Pharmacy\Supplier;
use Illuminate\Support\Facades\Log;

class UpdateExistingSupplier
{
    public function __invoke(
        string $supplierId,
        array $updatedSupplierDetails
    ): array {
        try {
            $supplier = Supplier::find($supplierId);

            if (! $supplier) {
                return CommonResponse::sendBadResponse();
            }

            $supplier->update([
                'supplier_name' => $updatedSupplierDetails['supplier_name'] ?? $supplier->supplier_name,
                'contact_person' => $updatedSupplierDetails['contact_person'] ?? $supplier->contact_person,
                'contact_number' => $updatedSupplierDetails['contact_number'] ?? $supplier->contact_number,
                'contact_email' => $updatedSupplierDetails['contact_email'] ?? $supplier->contact_email,
                'supplier_address' => $updatedSupplierDetails['supplier_address'] ?? $supplier->supplier_address,
                'supplier_city' => $updatedSupplierDetails['supplier_city'] ?? $supplier->supplier_city,
                'supplier_country' => $updatedSupplierDetails['supplier_country'] ?? $supplier->supplier_country,
                'supplier_type' => $updatedSupplierDetails['supplier_type'] ?? $supplier->supplier_type,
                'products_supplied' => $updatedSupplierDetails['products_supplied'] ?? $supplier->products_supplied,
                'rating' => $updatedSupplierDetails['rating'] ?? $supplier->rating,
                'discounts_agreements' => $updatedSupplierDetails['discounts_agreements'] ?? $supplier->discounts_agreements,
                'return_policy' => $updatedSupplierDetails['return_policy'] ?? $supplier->return_policy,
                'delivery_time' => $updatedSupplierDetails['delivery_time'] ?? $supplier->delivery_time,
                'payment_terms' => $updatedSupplierDetails['payment_terms'] ?? $supplier->payment_terms,
                'bank_details' => $updatedSupplierDetails['bank_details'] ?? $supplier->bank_details,
                'note' => $updatedSupplierDetails['note'] ?? $supplier->note,
            ]);

            return CommonResponse::sendSuccessResponse('Supplier updated successfully');
        } catch (\Exception $e) {
            Log::error('UpdateSupplier Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
