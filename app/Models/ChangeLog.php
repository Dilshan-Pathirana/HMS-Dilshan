<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChangeLog extends Model
{
    use HasFactory;

    const UPDATED_AT = null; // Only has created_at

    protected $fillable = [
        'user_id',
        'branch_id',
        'entity_type',
        'entity_id',
        'transaction_id',
        'action',
        'module',
        'severity',
        'before_data',
        'after_data',
        'changes',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'before_data' => 'array',
        'after_data' => 'array',
        'changes' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Get the user who made the change
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the branch
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    /**
     * Get the transaction (if applicable)
     */
    public function transaction()
    {
        return $this->belongsTo(\App\Models\Cashier\BillingTransaction::class, 'transaction_id');
    }

    /**
     * Get the changed entity (polymorphic)
     */
    public function entity()
    {
        return $this->morphTo();
    }

    /**
     * Scope to get logs by entity type
     */
    public function scopeByEntityType($query, $type)
    {
        return $query->where('entity_type', $type);
    }

    /**
     * Scope to get logs by action
     */
    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to get logs by branch
     */
    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Scope to get logs by module
     */
    public function scopeByModule($query, $module)
    {
        return $query->where('module', $module);
    }

    /**
     * Scope to get logs by severity
     */
    public function scopeBySeverity($query, $severity)
    {
        return $query->where('severity', $severity);
    }

    /**
     * Scope to get logs by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}
