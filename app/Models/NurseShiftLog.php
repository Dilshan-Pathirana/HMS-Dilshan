<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NurseShiftLog extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nurse_id',
        'branch_id',
        'ward',
        'shift_date',
        'shift_type',
        'scheduled_start',
        'scheduled_end',
        'actual_start',
        'actual_end',
        'status',
        'notes',
    ];

    protected $casts = [
        'shift_date' => 'date',
        'scheduled_start' => 'datetime',
        'scheduled_end' => 'datetime',
        'actual_start' => 'datetime',
        'actual_end' => 'datetime',
    ];

    // Status constants
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_STARTED = 'started';
    const STATUS_COMPLETED = 'completed';
    const STATUS_MISSED = 'missed';
    const STATUS_CANCELLED = 'cancelled';

    // Shift type constants
    const SHIFT_MORNING = 'morning';
    const SHIFT_AFTERNOON = 'afternoon';
    const SHIFT_NIGHT = 'night';

    /**
     * Get the nurse
     */
    public function nurse(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nurse_id');
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
     * Scope to filter by nurse
     */
    public function scopeForNurse($query, $nurseId)
    {
        return $query->where('nurse_id', $nurseId);
    }

    /**
     * Scope to filter by ward
     */
    public function scopeForWard($query, $ward)
    {
        return $query->where('ward', $ward);
    }

    /**
     * Scope to get today's shifts
     */
    public function scopeToday($query)
    {
        return $query->whereDate('shift_date', now()->toDateString());
    }

    /**
     * Scope to get shifts for a date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('shift_date', [$startDate, $endDate]);
    }

    /**
     * Scope to get active/ongoing shifts
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_STARTED);
    }

    /**
     * Scope to get scheduled shifts
     */
    public function scopeScheduled($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED);
    }

    /**
     * Start the shift
     */
    public function start(): void
    {
        $this->update([
            'status' => self::STATUS_STARTED,
            'actual_start' => now(),
        ]);
    }

    /**
     * End the shift
     */
    public function end(): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'actual_end' => now(),
        ]);
    }

    /**
     * Get shift time range
     */
    public static function getShiftTimes(string $shiftType, $date = null): array
    {
        $date = $date ? \Carbon\Carbon::parse($date) : now();
        
        return match ($shiftType) {
            self::SHIFT_MORNING => [
                'start' => $date->copy()->setTime(6, 0, 0),
                'end' => $date->copy()->setTime(14, 0, 0),
            ],
            self::SHIFT_AFTERNOON => [
                'start' => $date->copy()->setTime(14, 0, 0),
                'end' => $date->copy()->setTime(22, 0, 0),
            ],
            self::SHIFT_NIGHT => [
                'start' => $date->copy()->setTime(22, 0, 0),
                'end' => $date->copy()->addDay()->setTime(6, 0, 0),
            ],
            default => [
                'start' => $date->copy()->setTime(8, 0, 0),
                'end' => $date->copy()->setTime(16, 0, 0),
            ],
        };
    }

    /**
     * Get shift duration in hours
     */
    public function getDurationAttribute(): ?float
    {
        if ($this->actual_start && $this->actual_end) {
            return $this->actual_end->diffInMinutes($this->actual_start) / 60;
        }
        return null;
    }

    /**
     * Check if shift is currently active
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_STARTED;
    }

    /**
     * Get shift label
     */
    public static function getShiftLabel(string $shiftType): string
    {
        return match ($shiftType) {
            self::SHIFT_MORNING => 'Morning (6:00 AM - 2:00 PM)',
            self::SHIFT_AFTERNOON => 'Afternoon (2:00 PM - 10:00 PM)',
            self::SHIFT_NIGHT => 'Night (10:00 PM - 6:00 AM)',
            default => ucfirst($shiftType),
        };
    }
}
