<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $table = 'payroll';

    protected $fillable = [
        'employee_id',
        'center_id',
        'period',
        'base_salary',
        'overtime',
        'bonuses',
        'deductions',
        'attendance_adjustment',
        'gross_salary',
        'net_salary',
        'status',
        'generated_at',
        'disbursed_at',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'overtime' => 'decimal:2',
        'bonuses' => 'decimal:2',
        'deductions' => 'decimal:2',
        'attendance_adjustment' => 'decimal:2',
        'gross_salary' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'generated_at' => 'datetime',
        'disbursed_at' => 'datetime',
    ];

    /**
     * Get the employee
     */
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    /**
     * Get the center
     */
    public function center()
    {
        return $this->belongsTo(MedicalCenter::class, 'center_id');
    }

    /**
     * Get the disbursement record
     */
    public function disbursement()
    {
        return $this->hasOne(SalaryDisbursement::class, 'payroll_id');
    }

    /**
     * Scope to get pending payroll
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get disbursed payroll
     */
    public function scopeDisbursed($query)
    {
        return $query->where('status', 'disbursed');
    }

    /**
     * Scope to get payroll by period
     */
    public function scopeByPeriod($query, $period)
    {
        return $query->where('period', $period);
    }
}
