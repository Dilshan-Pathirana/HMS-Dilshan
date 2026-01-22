<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\AllUsers\User;

class EPFETFConfig extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'epf_etf_config';

    protected $fillable = [
        'branch_id',
        'epf_employee_rate',
        'epf_employer_rate',
        'etf_employer_rate',
        'epf_registration_number',
        'etf_registration_number',
        'company_name',
        'company_address',
        'company_contact',
        'effective_from',
        'payment_due_date',
        'auto_calculate',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'epf_employee_rate' => 'decimal:2',
        'epf_employer_rate' => 'decimal:2',
        'etf_employer_rate' => 'decimal:2',
        'effective_from' => 'date',
        'payment_due_date' => 'integer',
        'auto_calculate' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Get branch
     */
    public function branch()
    {
        return $this->belongsTo(\App\Models\Branch::class, 'branch_id');
    }

    /**
     * Get rate history
     */
    public function rateHistory()
    {
        return $this->hasMany(EPFETFRateHistory::class, 'config_id');
    }

    /**
     * Get creator
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get updater
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get total EPF rate (employee + employer)
     */
    public function getTotalEpfRateAttribute(): float
    {
        return $this->epf_employee_rate + $this->epf_employer_rate;
    }

    /**
     * Get total employer contribution rate
     */
    public function getTotalEmployerRateAttribute(): float
    {
        return $this->epf_employer_rate + $this->etf_employer_rate;
    }

    /**
     * Calculate EPF/ETF for a given basic salary
     */
    public function calculateContributions(float $basicSalary): array
    {
        return [
            'basic_salary' => $basicSalary,
            'epf_employee' => round($basicSalary * ($this->epf_employee_rate / 100), 2),
            'epf_employer' => round($basicSalary * ($this->epf_employer_rate / 100), 2),
            'etf_employer' => round($basicSalary * ($this->etf_employer_rate / 100), 2),
            'total_epf' => round($basicSalary * (($this->epf_employee_rate + $this->epf_employer_rate) / 100), 2),
            'total_employer_contribution' => round($basicSalary * (($this->epf_employer_rate + $this->etf_employer_rate) / 100), 2),
            'employee_take_home_deduction' => round($basicSalary * ($this->epf_employee_rate / 100), 2),
        ];
    }

    /**
     * Get active configuration
     */
    public static function getActive()
    {
        return self::where('is_active', true)->first();
    }
}
