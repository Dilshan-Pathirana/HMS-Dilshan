<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\AllUsers\User;

class PharmacyStockTransaction extends Model
{
    protected $fillable = [
        'pharmacy_inventory_id',
        'pharmacy_id',
        'transaction_type',
        'quantity',
        'quantity_before',
        'quantity_after',
        'unit_price',
        'total_amount',
        'performed_by',
        'notes',
        'reference_number',
        'related_pharmacy_id',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    /**
     * Get the inventory item for this transaction
     */
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(PharmacyInventory::class, 'pharmacy_inventory_id');
    }

    /**
     * Get the pharmacy for this transaction
     */
    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    /**
     * Get the user who performed this transaction
     */
    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Get the related pharmacy (for transfers)
     */
    public function relatedPharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class, 'related_pharmacy_id');
    }
}
