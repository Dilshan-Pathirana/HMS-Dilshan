<?php

namespace App\Models\Shift;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Shift extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'shift_management';

    protected $fillable = [
        'user_id',
        'branch_id',
        'shift_type',
        'days_of_week',
        'start_time',
        'end_time',
        'notes',
        'status',
        'acknowledged_at',
        'assigned_by',
        'effective_from',
        'effective_to',
        'rejection_reason',
    ];

    protected $casts = [
        'acknowledged_at' => 'datetime',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    /**
     * Check if shift is pending acknowledgment
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if shift has been acknowledged
     */
    public function isAcknowledged(): bool
    {
        return $this->status === 'acknowledged' || $this->status === 'active';
    }

    /**
     * Acknowledge the shift
     */
    public function acknowledge(): bool
    {
        $this->status = 'acknowledged';
        $this->acknowledged_at = now();
        return $this->save();
    }

    /**
     * Reject the shift
     */
    public function reject(string $reason = null): bool
    {
        $this->status = 'rejected';
        $this->rejection_reason = $reason;
        return $this->save();
    }
}
