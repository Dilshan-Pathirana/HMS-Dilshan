<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\AllUsers\User;
use App\Models\Branch;

class SalaryStructure extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'salary_structures';

    protected $fillable = [
        'branch_id',
        'grade_code',
        'title',
        'description',
        'min_salary',
        'max_salary',
        // Basic Allowances
        'medical_allowance',
        'transport_allowance',
        'housing_allowance',
        'meal_allowance',
        'other_allowance',
        // Extended Allowances
        'q_pay',
        'cost_of_living',
        'uniform_allowance',
        'cola_allowance',
        'attendance_allowance',
        'telephone_allowance',
        'professional_allowance',
        'shift_allowance',
        'night_duty_allowance',
        'on_call_allowance',
        // Bonuses
        'annual_bonus',
        'performance_bonus',
        'festival_bonus',
        'incentive_bonus',
        'commission_rate',
        // Statutory
        'epf_applicable',
        'etf_applicable',
        'paye_applicable',
        // Deductions
        'welfare_fund',
        'insurance_deduction',
        'max_salary_advance',
        'max_loan_amount',
        // Overtime
        'overtime_rate_multiplier',
        'holiday_rate_multiplier',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'min_salary' => 'decimal:2',
        'max_salary' => 'decimal:2',
        // Basic Allowances
        'medical_allowance' => 'decimal:2',
        'transport_allowance' => 'decimal:2',
        'housing_allowance' => 'decimal:2',
        'meal_allowance' => 'decimal:2',
        'other_allowance' => 'decimal:2',
        // Extended Allowances
        'q_pay' => 'decimal:2',
        'cost_of_living' => 'decimal:2',
        'uniform_allowance' => 'decimal:2',
        'cola_allowance' => 'decimal:2',
        'attendance_allowance' => 'decimal:2',
        'telephone_allowance' => 'decimal:2',
        'professional_allowance' => 'decimal:2',
        'shift_allowance' => 'decimal:2',
        'night_duty_allowance' => 'decimal:2',
        'on_call_allowance' => 'decimal:2',
        // Bonuses
        'annual_bonus' => 'decimal:2',
        'performance_bonus' => 'decimal:2',
        'festival_bonus' => 'decimal:2',
        'incentive_bonus' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        // Statutory
        'epf_applicable' => 'boolean',
        'etf_applicable' => 'boolean',
        'paye_applicable' => 'boolean',
        // Deductions
        'welfare_fund' => 'decimal:2',
        'insurance_deduction' => 'decimal:2',
        'max_salary_advance' => 'decimal:2',
        'max_loan_amount' => 'decimal:2',
        // Overtime
        'overtime_rate_multiplier' => 'decimal:2',
        'holiday_rate_multiplier' => 'decimal:2',
    ];

    /**
     * Get total allowances (all allowance types)
     */
    public function getTotalAllowancesAttribute(): float
    {
        return $this->medical_allowance + 
               $this->transport_allowance + 
               $this->housing_allowance + 
               $this->meal_allowance + 
               $this->other_allowance +
               $this->q_pay +
               $this->cost_of_living +
               $this->uniform_allowance +
               $this->cola_allowance +
               $this->attendance_allowance +
               $this->telephone_allowance +
               $this->professional_allowance +
               $this->shift_allowance +
               $this->night_duty_allowance +
               $this->on_call_allowance;
    }

    /**
     * Get total bonuses
     */
    public function getTotalBonusesAttribute(): float
    {
        return $this->annual_bonus + 
               $this->performance_bonus + 
               $this->festival_bonus + 
               $this->incentive_bonus;
    }

    /**
     * Get total deductions (fixed amounts)
     */
    public function getTotalDeductionsAttribute(): float
    {
        return $this->welfare_fund + $this->insurance_deduction;
    }

    /**
     * Get the branch this structure belongs to
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the user who created this structure
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this structure
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope for active structures
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Active');
    }

    /**
     * Get average salary for this grade
     */
    public function getAverageSalaryAttribute(): float
    {
        return ($this->min_salary + $this->max_salary) / 2;
    }
}
