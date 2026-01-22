<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pharmacy extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'branch_id',
        'pharmacy_name',
        'pharmacy_code',
        'license_number',
        'license_expiry_date',
        'phone',
        'email',
        'location_in_branch',
        'operating_hours',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'license_expiry_date' => 'date',
    ];

    /**
     * Accessor for operating_hours to handle JSON conversion safely
     */
    public function getOperatingHoursAttribute($value)
    {
        if (is_null($value) || $value === '') {
            return null;
        }
        if (is_array($value)) {
            return $value;
        }
        return json_decode($value, true) ?? null;
    }

    /**
     * Mutator for operating_hours to handle JSON conversion
     */
    public function setOperatingHoursAttribute($value)
    {
        if (is_null($value) || $value === '') {
            $this->attributes['operating_hours'] = null;
        } elseif (is_array($value)) {
            $this->attributes['operating_hours'] = json_encode($value);
        } else {
            $this->attributes['operating_hours'] = $value;
        }
    }

    /**
     * Get the branch that owns the pharmacy
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get all inventory items for this pharmacy
     */
    public function inventory(): HasMany
    {
        return $this->hasMany(PharmacyInventory::class);
    }

    /**
     * Get all stock transactions for this pharmacy
     */
    public function stockTransactions(): HasMany
    {
        return $this->hasMany(PharmacyStockTransaction::class);
    }

    /**
     * Get low stock items (below reorder level)
     */
    public function lowStockItems()
    {
        return $this->inventory()
            ->whereColumn('quantity_in_stock', '<=', 'reorder_level')
            ->where('is_active', true);
    }

    /**
     * Get items expiring soon (within 30 days)
     */
    public function expiringItems()
    {
        return $this->inventory()
            ->where('expiration_date', '<=', now()->addDays(30))
            ->where('expiration_date', '>=', now())
            ->where('is_active', true);
    }
}
