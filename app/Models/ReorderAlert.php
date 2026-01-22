<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReorderAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'medication_id',
        'current_stock',
        'alert_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'current_stock' => 'integer',
        'alert_date' => 'datetime',
    ];

    /**
     * Get the medication
     */
    public function medication()
    {
        return $this->belongsTo(Medication::class, 'medication_id');
    }

    /**
     * Scope to get pending alerts
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get ordered alerts
     */
    public function scopeOrdered($query)
    {
        return $query->where('status', 'ordered');
    }
}
