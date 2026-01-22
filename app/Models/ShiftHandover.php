<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftHandover extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'from_nurse_id',
        'to_nurse_id',
        'branch_id',
        'ward',
        'handover_date',
        'from_shift',
        'to_shift',
        'patient_updates',
        'pending_tasks',
        'critical_alerts',
        'general_notes',
        'special_observations',
        'is_acknowledged',
        'acknowledged_at',
    ];

    protected $casts = [
        'handover_date' => 'date',
        'patient_updates' => 'array',
        'pending_tasks' => 'array',
        'critical_alerts' => 'array',
        'is_acknowledged' => 'boolean',
        'acknowledged_at' => 'datetime',
    ];

    /**
     * Get the nurse who is handing over
     */
    public function fromNurse(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_nurse_id');
    }

    /**
     * Get the nurse receiving the handover
     */
    public function toNurse(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_nurse_id');
    }

    /**
     * Get the branch
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(MedicalCenter::class, 'branch_id');
    }

    /**
     * Scope to filter by branch
     */
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Scope to filter by ward
     */
    public function scopeForWard($query, $ward)
    {
        return $query->where('ward', $ward);
    }

    /**
     * Scope to get pending acknowledgements
     */
    public function scopePending($query)
    {
        return $query->where('is_acknowledged', false);
    }

    /**
     * Scope to get acknowledged handovers
     */
    public function scopeAcknowledged($query)
    {
        return $query->where('is_acknowledged', true);
    }

    /**
     * Scope to get handovers for a specific nurse (either from or to)
     */
    public function scopeForNurse($query, $nurseId)
    {
        return $query->where(function ($q) use ($nurseId) {
            $q->where('from_nurse_id', $nurseId)
              ->orWhere('to_nurse_id', $nurseId);
        });
    }

    /**
     * Acknowledge the handover
     */
    public function acknowledge(): void
    {
        $this->update([
            'is_acknowledged' => true,
            'acknowledged_at' => now(),
        ]);
    }

    /**
     * Get shift label
     */
    public static function getShiftLabel(string $shift): string
    {
        return match ($shift) {
            'morning' => 'Morning (6:00 AM - 2:00 PM)',
            'afternoon' => 'Afternoon (2:00 PM - 10:00 PM)',
            'night' => 'Night (10:00 PM - 6:00 AM)',
            default => ucfirst($shift),
        };
    }
}
