<?php

namespace App\Models\Cashier;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Branch;
use App\Models\AllUsers\User;

class DailyCashSummary extends Model
{
    use HasUuids;

    protected $table = 'daily_cash_summaries';

    protected $fillable = [
        'branch_id',
        'cashier_id',
        'summary_date',
        'total_transactions',
        'total_sales',
        'cash_total',
        'cash_count',
        'card_total',
        'card_count',
        'online_total',
        'online_count',
        'qr_total',
        'qr_count',
        'cash_in_total',
        'cash_out_total',
        'expected_cash_balance',
        'actual_cash_counted',
        'cash_variance',
        'variance_remarks',
        'eod_status',
        'submitted_at',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'summary_date' => 'date',
        'total_transactions' => 'integer',
        'total_sales' => 'decimal:2',
        'cash_total' => 'decimal:2',
        'cash_count' => 'integer',
        'card_total' => 'decimal:2',
        'card_count' => 'integer',
        'online_total' => 'decimal:2',
        'online_count' => 'integer',
        'qr_total' => 'decimal:2',
        'qr_count' => 'integer',
        'cash_in_total' => 'decimal:2',
        'cash_out_total' => 'decimal:2',
        'expected_cash_balance' => 'decimal:2',
        'actual_cash_counted' => 'decimal:2',
        'cash_variance' => 'decimal:2',
        'submitted_at' => 'datetime',
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

    public function transactions(): HasMany
    {
        return $this->hasMany(BillingTransaction::class, 'eod_summary_id');
    }

    public function cashEntries(): HasMany
    {
        return $this->hasMany(CashEntry::class, 'eod_summary_id');
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
        return $query->whereDate('summary_date', $date);
    }

    public function scopeOpen($query)
    {
        return $query->where('eod_status', 'OPEN');
    }

    public function scopeSubmitted($query)
    {
        return $query->where('eod_status', 'SUBMITTED');
    }
}
