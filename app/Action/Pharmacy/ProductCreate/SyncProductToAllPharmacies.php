<?php

namespace App\Action\Pharmacy\ProductCreate;

use App\Models\Pharmacy;
use App\Models\PharmacyInventory;
use Illuminate\Support\Facades\Log;

class SyncProductToAllPharmacies
{
    /**
     * Sync a product to all pharmacies.
     * This creates an inventory entry in each pharmacy with default values
     * for pharmacy-specific fields (price, stock, expiry, etc.)
     */
    public static function execute(array $productData, string $productId): int
    {
        $syncedCount = 0;
        
        try {
            // Get all active pharmacies
            $pharmacies = Pharmacy::where('is_active', true)->get();
            
            foreach ($pharmacies as $pharmacy) {
                // Check if product already exists in this pharmacy's inventory
                $existingItem = PharmacyInventory::where('pharmacy_id', $pharmacy->id)
                    ->where('medication_name', $productData['item_name'])
                    ->first();
                
                if (!$existingItem) {
                    // Create inventory entry with base product info
                    // Pharmacy-specific fields are set to defaults
                    PharmacyInventory::create([
                        'pharmacy_id' => $pharmacy->id,
                        'medication_name' => $productData['item_name'],
                        'generic_name' => $productData['generic_name'] ?? null,
                        'dosage_form' => $productData['category'] ?? 'General',
                        'strength' => 'N/A',
                        'manufacturer' => $productData['brand_name'] ?? null,
                        'supplier' => null, // Will be set individually by each pharmacy
                        'batch_number' => 'PENDING',
                        'expiration_date' => now()->addYear(), // Default 1 year, to be updated by pharmacy
                        'quantity_in_stock' => 0, // Each pharmacy manages their own stock
                        'reorder_level' => 10,
                        'unit_cost' => 0, // To be set by each pharmacy
                        'selling_price' => 0, // To be set by each pharmacy
                        'discount_percentage' => 0,
                        'storage_location' => null,
                        'notes' => 'Auto-synced from master product catalog. Please update pricing and stock information.',
                        'is_active' => true,
                    ]);
                    
                    $syncedCount++;
                }
            }
            
            Log::info("Product '{$productData['item_name']}' synced to {$syncedCount} pharmacies");
            
        } catch (\Exception $e) {
            Log::error('SyncProductToAllPharmacies Error: ' . $e->getMessage());
        }
        
        return $syncedCount;
    }
}
