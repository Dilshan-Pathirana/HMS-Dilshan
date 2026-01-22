<?php

namespace App\Action\Pharmacy\Inventory;

use App\Models\PharmacyInventory;

class InventoryItemCreate
{
    public static function execute(array $request): PharmacyInventory
    {
        return PharmacyInventory::create([
            'pharmacy_id' => $request['pharmacy_id'],
            'medication_name' => $request['medication_name'],
            'generic_name' => $request['generic_name'] ?? null,
            'dosage_form' => $request['dosage_form'],
            'strength' => $request['strength'] ?? 'N/A',
            'manufacturer' => $request['manufacturer'] ?? null,
            'supplier' => $request['supplier'] ?? null,
            'batch_number' => $request['batch_number'],
            'expiration_date' => $request['expiration_date'],
            'quantity_in_stock' => $request['quantity_in_stock'],
            'reorder_level' => $request['reorder_level'],
            'unit_cost' => $request['unit_cost'],
            'selling_price' => $request['selling_price'] ?? $request['unit_cost'],
            'discount_percentage' => $request['discount_percentage'] ?? 0,
            'storage_location' => $request['storage_location'] ?? null,
            'notes' => $request['notes'] ?? null,
            'is_active' => $request['is_active'] ?? true,
        ]);
    }
}
