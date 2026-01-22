<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Medication extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'medication_name',
        'generic_name',
        'brand_name',
        'dosage_form',
        'strength',
        'quantity_in_stock',
        'reorder_level',
        'expiration_date',
        'price_per_unit',
        'discount',
        'selling_price',
        'center_id',
        'description',
        'manufacturer',
        'is_active',
    ];

    protected $casts = [
        'quantity_in_stock' => 'integer',
        'reorder_level' => 'integer',
        'expiration_date' => 'date',
        'price_per_unit' => 'decimal:2',
        'discount' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get the center for this medication
     */
    public function center()
    {
        return $this->belongsTo(MedicalCenter::class, 'center_id');
    }

    /**
     * Get all prescriptions for this medication
     */
    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'medication_id');
    }

    /**
     * Get all dispensing records for this medication
     */
    public function dispensingRecords()
    {
        return $this->hasMany(DispensingRecord::class, 'medication_id');
    }

    /**
     * Get all reorder alerts for this medication
     */
    public function reorderAlerts()
    {
        return $this->hasMany(ReorderAlert::class, 'medication_id');
    }

    /**
     * Check if medication is low stock
     */
    public function isLowStock()
    {
        return $this->quantity_in_stock <= $this->reorder_level;
    }

    /**
     * Check if medication is expiring soon
     */
    public function isExpiringSoon($days = 30)
    {
        if (!$this->expiration_date) {
            return false;
        }
        return $this->expiration_date->diffInDays(now()) <= $days;
    }

    /**
     * Scope to get low stock medications
     */
    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity_in_stock', '<=', 'reorder_level');
    }

    /**
     * Scope to get expiring medications
     */
    public function scopeExpiring($query, $days = 30)
    {
        return $query->where('expiration_date', '<=', now()->addDays($days));
    }

    /**
     * Scope to get active medications
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
