<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryDisbursement extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_id',
        'employee_id',
        'amount',
        'payment_method',
        'transaction_id',
        'disbursed_by',
        'disbursement_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'disbursement_date' => 'datetime',
    ];

    /**
     * Get the payroll record
     */
    public function payroll()
    {
        return $this->belongsTo(Payroll::class, 'payroll_id');
    }

    /**
     * Get the employee
     */
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    /**
     * Get the user who disbursed
     */
    public function disburser()
    {
        return $this->belongsTo(User::class, 'disbursed_by');
    }

    /**
     * Scope to get completed disbursements
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope to get disbursements by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('disbursement_date', [$startDate, $endDate]);
    }
}
