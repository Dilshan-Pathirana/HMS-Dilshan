<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Payroll Configuration Table for branch-wise payroll settings
     */
    public function up(): void
    {
        Schema::create('payroll_config', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('branch_id')->nullable(); // null = global default
            
            // Pay Period Settings
            $table->string('pay_period')->default('monthly'); // weekly, bi-weekly, monthly
            $table->integer('pay_day')->default(25); // Day of month for monthly
            $table->string('pay_cycle_start')->default('1'); // 1st of month
            
            // Working Hours Settings
            $table->decimal('standard_hours_per_day', 4, 2)->default(8.00);
            $table->decimal('standard_hours_per_week', 5, 2)->default(45.00);
            $table->decimal('standard_days_per_month', 4, 2)->default(26.00);
            
            // Overtime Settings
            $table->decimal('overtime_rate', 4, 2)->default(1.50); // 1.5x
            $table->decimal('weekend_rate', 4, 2)->default(2.00); // 2x
            $table->decimal('holiday_rate', 4, 2)->default(2.50); // 2.5x
            $table->decimal('night_shift_allowance', 10, 2)->default(0); // Fixed amount
            $table->decimal('night_shift_rate', 4, 2)->default(1.10); // 1.1x
            $table->time('night_shift_start')->default('22:00:00');
            $table->time('night_shift_end')->default('06:00:00');
            $table->decimal('max_overtime_hours_per_day', 4, 2)->default(4.00);
            $table->decimal('max_overtime_hours_per_week', 5, 2)->default(16.00);
            
            // Attendance Settings
            $table->integer('grace_period_minutes')->default(15);
            $table->integer('half_day_threshold_hours')->default(4);
            $table->decimal('late_deduction_per_minute', 6, 2)->default(0);
            $table->decimal('absent_deduction_multiplier', 4, 2)->default(1.00);
            
            // Leave Settings
            $table->boolean('unpaid_leave_deduction')->default(true);
            $table->decimal('unpaid_leave_rate', 4, 2)->default(1.00); // 1x daily rate
            
            // Salary Components
            $table->boolean('include_allowances_in_basic')->default(false);
            $table->boolean('include_allowances_in_epf')->default(false);
            $table->boolean('include_ot_in_epf')->default(false);
            
            // Tax Settings (PAYE - Sri Lanka)
            $table->boolean('auto_calculate_paye')->default(true);
            $table->decimal('tax_free_threshold', 12, 2)->default(100000.00); // Monthly
            
            // Rounding Settings
            $table->string('rounding_method')->default('normal'); // normal, up, down
            $table->integer('rounding_precision')->default(2);
            
            // Currency
            $table->string('currency_code')->default('LKR');
            $table->string('currency_symbol')->default('Rs.');
            
            // Payslip Settings
            $table->boolean('show_ytd_on_payslip')->default(true);
            $table->boolean('show_leave_balance_on_payslip')->default(true);
            $table->boolean('show_loan_balance_on_payslip')->default(true);
            $table->string('payslip_template')->default('default');
            
            // Approval Settings
            $table->boolean('require_payroll_approval')->default(true);
            $table->integer('approval_levels')->default(2);
            
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            
            $table->index('branch_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_config');
    }
};
