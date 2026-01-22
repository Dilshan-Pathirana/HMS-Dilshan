<?php

namespace App\Models\HRM;

use App\Models\Branch;
use App\Models\AllUsers\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollConfig extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'payroll_config';

    protected $fillable = [
        'branch_id',
        // Pay Period
        'pay_period',
        'pay_day',
        'pay_cycle_start',
        // Working Hours
        'standard_hours_per_day',
        'standard_hours_per_week',
        'standard_days_per_month',
        // Overtime
        'overtime_rate',
        'weekend_rate',
        'holiday_rate',
        'night_shift_allowance',
        'night_shift_rate',
        'night_shift_start',
        'night_shift_end',
        'max_overtime_hours_per_day',
        'max_overtime_hours_per_week',
        // Attendance
        'grace_period_minutes',
        'half_day_threshold_hours',
        'late_deduction_per_minute',
        'absent_deduction_multiplier',
        // Leave
        'unpaid_leave_deduction',
        'unpaid_leave_rate',
        // Salary Components
        'include_allowances_in_basic',
        'include_allowances_in_epf',
        'include_ot_in_epf',
        // Tax
        'auto_calculate_paye',
        'tax_free_threshold',
        // Rounding
        'rounding_method',
        'rounding_precision',
        // Currency
        'currency_code',
        'currency_symbol',
        // Payslip
        'show_ytd_on_payslip',
        'show_leave_balance_on_payslip',
        'show_loan_balance_on_payslip',
        'payslip_template',
        // Approval
        'require_payroll_approval',
        'approval_levels',
        // Status
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'pay_day' => 'integer',
        'standard_hours_per_day' => 'decimal:2',
        'standard_hours_per_week' => 'decimal:2',
        'standard_days_per_month' => 'decimal:2',
        'overtime_rate' => 'decimal:2',
        'weekend_rate' => 'decimal:2',
        'holiday_rate' => 'decimal:2',
        'night_shift_allowance' => 'decimal:2',
        'night_shift_rate' => 'decimal:2',
        'max_overtime_hours_per_day' => 'decimal:2',
        'max_overtime_hours_per_week' => 'decimal:2',
        'grace_period_minutes' => 'integer',
        'half_day_threshold_hours' => 'integer',
        'late_deduction_per_minute' => 'decimal:2',
        'absent_deduction_multiplier' => 'decimal:2',
        'unpaid_leave_deduction' => 'boolean',
        'unpaid_leave_rate' => 'decimal:2',
        'include_allowances_in_basic' => 'boolean',
        'include_allowances_in_epf' => 'boolean',
        'include_ot_in_epf' => 'boolean',
        'auto_calculate_paye' => 'boolean',
        'tax_free_threshold' => 'decimal:2',
        'rounding_precision' => 'integer',
        'show_ytd_on_payslip' => 'boolean',
        'show_leave_balance_on_payslip' => 'boolean',
        'show_loan_balance_on_payslip' => 'boolean',
        'require_payroll_approval' => 'boolean',
        'approval_levels' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the branch that owns the config
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the user who created this config
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this config
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope for active configs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for global config
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('branch_id');
    }

    /**
     * Scope for branch-specific config
     */
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Get available pay periods
     */
    public static function getPayPeriods(): array
    {
        return [
            'weekly' => 'Weekly',
            'bi-weekly' => 'Bi-Weekly (Fortnightly)',
            'monthly' => 'Monthly',
        ];
    }

    /**
     * Get available rounding methods
     */
    public static function getRoundingMethods(): array
    {
        return [
            'normal' => 'Normal (0.5 up)',
            'up' => 'Always Round Up',
            'down' => 'Always Round Down',
            'none' => 'No Rounding',
        ];
    }

    /**
     * Get available payslip templates
     */
    public static function getPayslipTemplates(): array
    {
        return [
            'default' => 'Default Template',
            'detailed' => 'Detailed Template',
            'simple' => 'Simple Template',
            'compact' => 'Compact Template',
        ];
    }

    /**
     * Calculate daily rate from monthly salary
     */
    public function calculateDailyRate(float $monthlySalary): float
    {
        return round($monthlySalary / $this->standard_days_per_month, 2);
    }

    /**
     * Calculate hourly rate from monthly salary
     */
    public function calculateHourlyRate(float $monthlySalary): float
    {
        $dailyRate = $this->calculateDailyRate($monthlySalary);
        return round($dailyRate / $this->standard_hours_per_day, 2);
    }

    /**
     * Calculate overtime amount
     */
    public function calculateOvertime(float $hourlyRate, float $hours, string $type = 'normal'): float
    {
        $multiplier = match($type) {
            'weekend' => $this->weekend_rate,
            'holiday' => $this->holiday_rate,
            'night' => $this->night_shift_rate,
            default => $this->overtime_rate,
        };
        
        return round($hourlyRate * $hours * $multiplier, 2);
    }

    /**
     * Get Sri Lanka default payroll configuration
     */
    public static function getSriLankaDefaults(): array
    {
        return [
            'pay_period' => 'monthly',
            'pay_day' => 25,
            'pay_cycle_start' => '1',
            'standard_hours_per_day' => 8.00,
            'standard_hours_per_week' => 45.00,
            'standard_days_per_month' => 26.00,
            'overtime_rate' => 1.50,
            'weekend_rate' => 2.00,
            'holiday_rate' => 2.50,
            'night_shift_allowance' => 500.00,
            'night_shift_rate' => 1.10,
            'night_shift_start' => '22:00:00',
            'night_shift_end' => '06:00:00',
            'max_overtime_hours_per_day' => 4.00,
            'max_overtime_hours_per_week' => 16.00,
            'grace_period_minutes' => 15,
            'half_day_threshold_hours' => 4,
            'late_deduction_per_minute' => 0,
            'absent_deduction_multiplier' => 1.00,
            'unpaid_leave_deduction' => true,
            'unpaid_leave_rate' => 1.00,
            'include_allowances_in_basic' => false,
            'include_allowances_in_epf' => false,
            'include_ot_in_epf' => false,
            'auto_calculate_paye' => true,
            'tax_free_threshold' => 100000.00,
            'rounding_method' => 'normal',
            'rounding_precision' => 2,
            'currency_code' => 'LKR',
            'currency_symbol' => 'Rs.',
            'show_ytd_on_payslip' => true,
            'show_leave_balance_on_payslip' => true,
            'show_loan_balance_on_payslip' => true,
            'payslip_template' => 'default',
            'require_payroll_approval' => true,
            'approval_levels' => 2,
            'is_active' => true,
        ];
    }
}
