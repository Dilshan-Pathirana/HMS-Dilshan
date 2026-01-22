<?php

namespace App\Models\Cashier;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Branch;
use App\Models\AllUsers\User;

class CashEntry extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'cash_entries';

    protected $fillable = [
        'branch_id',
        'cashier_id',
        'entry_type',
        'category',
        'amount',
        'entry_date',
        'description',
        'reference_number',
        'remarks',
        'approval_status',
        'approved_by',
        'approved_at',
        'eod_summary_id',
        'is_locked',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'entry_date' => 'date',
        'is_locked' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function eodSummary(): BelongsTo
    {
        return $this->belongsTo(DailyCashSummary::class, 'eod_summary_id');
    }

    // Scopes
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeForCashier($query, $cashierId)
    {
        return $query->where('cashier_id', $cashierId);
    }

    public function scopeForDate($query, $date)
    {
        return $query->whereDate('entry_date', $date);
    }

    public function scopeCashIn($query)
    {
        return $query->where('entry_type', 'CASH_IN');
    }

    public function scopeCashOut($query)
    {
        return $query->where('entry_type', 'CASH_OUT');
    }

    public function scopeUnlocked($query)
    {
        return $query->where('is_locked', false);
    }
}
