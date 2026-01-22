<?php

namespace App\Action\Pharmacy\Inventory;

use App\Models\PharmacyInventory;
use App\Models\PharmacyStockTransaction;

class InventoryStockTransaction
{
    public static function execute(PharmacyInventory $inventoryItem, array $request): void
    {
        PharmacyStockTransaction::create([
            'pharmacy_inventory_id' => $inventoryItem->id,
            'pharmacy_id' => $inventoryItem->pharmacy_id,
            'transaction_type' => 'purchase',
            'quantity' => $inventoryItem->quantity_in_stock,
            'quantity_before' => 0,
            'quantity_after' => $inventoryItem->quantity_in_stock,
            'unit_price' => $inventoryItem->unit_cost,
            'total_amount' => $inventoryItem->unit_cost * $inventoryItem->quantity_in_stock,
            'performed_by' => auth()->id(),
            'notes' => 'Initial stock entry',
        ]);
    }
}
