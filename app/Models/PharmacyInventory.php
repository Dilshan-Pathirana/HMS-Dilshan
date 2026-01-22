<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PharmacyInventory extends Model
{
    use SoftDeletes;

    protected $table = 'pharmacy_inventory';

    protected $fillable = [
        'pharmacy_id',
        'medication_name',
        'generic_name',
        'dosage_form',
        'strength',
        'manufacturer',
        'supplier',
        'batch_number',
        'expiration_date',
        'quantity_in_stock',
        'reorder_level',
        'unit_cost',
        'selling_price',
        'discount_percentage',
        'storage_location',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'unit_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get the pharmacy that owns this inventory item
     */
    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    /**
     * Get all transactions for this inventory item
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(PharmacyStockTransaction::class);
    }

    /**
     * Check if item is low in stock
     */
    public function isLowStock(): bool
    {
        return $this->quantity_in_stock <= $this->reorder_level;
    }

    /**
     * Check if item is expired
     */
    public function isExpired(): bool
    {
        return $this->expiration_date < now();
    }

    /**
     * Check if item is expiring soon (within 30 days)
     */
    public function isExpiringSoon(): bool
    {
        return $this->expiration_date <= now()->addDays(30) && !$this->isExpired();
    }

    /**
     * Get the final selling price after discount
     */
    public function getFinalPriceAttribute(): float
    {
        return $this->selling_price * (1 - ($this->discount_percentage / 100));
    }
}
