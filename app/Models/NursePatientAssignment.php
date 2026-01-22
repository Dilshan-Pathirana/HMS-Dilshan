<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursePatientAssignment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nurse_id',
        'patient_id',
        'branch_id',
        'ward',
        'assigned_date',
        'shift',
        'is_primary',
        'is_active',
        'assigned_by',
        'notes',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Get the nurse
     */
    public function nurse(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nurse_id');
    }

    /**
     * Get the patient
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the branch
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(MedicalCenter::class, 'branch_id');
    }

    /**
     * Get the assigner
     */
    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
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
     * Scope to filter by shift
     */
    public function scopeForShift($query, $shift)
    {
        return $query->where('shift', $shift);
    }

    /**
     * Scope to get active assignments
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get today's assignments
     */
    public function scopeToday($query)
    {
        return $query->whereDate('assigned_date', now()->toDateString());
    }

    /**
     * Scope to get primary assignments
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }
}
