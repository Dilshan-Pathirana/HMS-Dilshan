<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeletionLog extends Model
{
    use HasFactory;

    const UPDATED_AT = null; // Only has created_at

    protected $fillable = [
        'user_id',
        'entity_type',
        'entity_id',
        'deleted_data',
        'reason',
        'ip_address',
        'deleted_at',
    ];

    protected $casts = [
        'deleted_data' => 'array',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    /**
     * Get the user who deleted the record
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope to get logs by entity type
     */
    public function scopeByEntityType($query, $type)
    {
        return $query->where('entity_type', $type);
    }

    /**
     * Scope to get logs by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('deleted_at', [$startDate, $endDate]);
    }
}
