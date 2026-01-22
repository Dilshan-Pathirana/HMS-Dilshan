<?php

namespace App\Models\Cashier;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Branch;
use App\Models\AllUsers\User;

class BillingTransaction extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'billing_transactions';

    protected $fillable = [
        'branch_id',
        'cashier_id',
        'patient_id',
        'transaction_type',
        'invoice_number',
        'receipt_number',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'payment_status',
        'payment_method',
        'service_details',
        'remarks',
        'patient_name',
        'patient_phone',
        'transaction_date',
        'eod_summary_id',
        'is_locked',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'transaction_date' => 'date',
        'is_locked' => 'boolean',
        'service_details' => 'array',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
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
        return $query->whereDate('transaction_date', $date);
    }

    public function scopeUnlocked($query)
    {
        return $query->where('is_locked', false);
    }
}
