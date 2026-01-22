<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * STEP 10 & 11: Payroll Components and EPF/ETF Configuration
     */
    public function up(): void
    {
        // Salary Grades Table
        Schema::create('salary_grades', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('grade_code')->unique(); // G1, G2, G3...
            $table->string('grade_name');
            $table->decimal('min_salary', 12, 2);
            $table->decimal('max_salary', 12, 2);
            $table->decimal('housing_allowance', 10, 2)->default(0);
            $table->decimal('transport_allowance', 10, 2)->default(0);
            $table->decimal('meal_allowance', 10, 2)->default(0);
            $table->decimal('medical_allowance', 10, 2)->default(0);
            $table->decimal('other_allowances', 10, 2)->default(0);
            $table->boolean('epf_applicable')->default(true);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });
        
        // EPF/ETF Configuration Table (Sri Lanka statutory rates)
        Schema::create('statutory_config', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('config_key')->unique();
            $table->string('config_value');
            $table->string('description')->nullable();
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        
        // Seed EPF/ETF rates
        DB::table('statutory_config')->insert([
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'config_key' => 'epf_employee_rate',
                'config_value' => '8.00',
                'description' => 'EPF Employee Contribution Rate (%)',
                'effective_from' => '2024-01-01',
                'effective_to' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'config_key' => 'epf_employer_rate',
                'config_value' => '12.00',
                'description' => 'EPF Employer Contribution Rate (%)',
                'effective_from' => '2024-01-01',
                'effective_to' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'config_key' => 'etf_employer_rate',
                'config_value' => '3.00',
                'description' => 'ETF Employer Contribution Rate (%)',
                'effective_from' => '2024-01-01',
                'effective_to' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'config_key' => 'overtime_rate_multiplier',
                'config_value' => '1.50',
                'description' => 'Overtime Rate Multiplier (1.5x normal rate)',
                'effective_from' => '2024-01-01',
                'effective_to' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'config_key' => 'holiday_rate_multiplier',
                'config_value' => '2.00',
                'description' => 'Holiday Rate Multiplier (2x normal rate)',
                'effective_from' => '2024-01-01',
                'effective_to' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
        
        // Payroll Runs Table
        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('branch_id')->nullable();
            $table->string('pay_period'); // e.g., 2025-01
            $table->date('pay_date');
            $table->enum('status', ['draft', 'processing', 'approved', 'paid', 'cancelled'])->default('draft');
            $table->integer('employee_count')->default(0);
            $table->decimal('total_gross', 14, 2)->default(0);
            $table->decimal('total_deductions', 14, 2)->default(0);
            $table->decimal('total_net', 14, 2)->default(0);
            $table->decimal('total_epf_employee', 12, 2)->default(0);
            $table->decimal('total_epf_employer', 12, 2)->default(0);
            $table->decimal('total_etf_employer', 12, 2)->default(0);
            $table->uuid('processed_by')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->dateTime('processed_at')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('branch_id');
            $table->index('pay_period');
            $table->index('status');
        });
        
        // Payroll Items (Individual employee payroll entries)
        Schema::create('payroll_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payroll_run_id');
            $table->uuid('user_id');
            $table->uuid('branch_id');
            
            // Earnings
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->decimal('housing_allowance', 10, 2)->default(0);
            $table->decimal('transport_allowance', 10, 2)->default(0);
            $table->decimal('meal_allowance', 10, 2)->default(0);
            $table->decimal('medical_allowance', 10, 2)->default(0);
            $table->decimal('other_allowances', 10, 2)->default(0);
            $table->decimal('overtime_amount', 10, 2)->default(0);
            $table->decimal('overtime_hours', 6, 2)->default(0);
            $table->decimal('bonus', 10, 2)->default(0);
            $table->decimal('gross_salary', 12, 2)->default(0);
            
            // Deductions
            $table->decimal('epf_employee', 10, 2)->default(0);
            $table->decimal('no_pay_deduction', 10, 2)->default(0);
            $table->decimal('loan_deduction', 10, 2)->default(0);
            $table->decimal('advance_deduction', 10, 2)->default(0);
            $table->decimal('other_deductions', 10, 2)->default(0);
            $table->decimal('total_deductions', 12, 2)->default(0);
            
            // Net
            $table->decimal('net_salary', 12, 2)->default(0);
            
            // Employer Contributions
            $table->decimal('epf_employer', 10, 2)->default(0);
            $table->decimal('etf_employer', 10, 2)->default(0);
            
            // Leave info
            $table->integer('days_worked')->default(0);
            $table->integer('leave_days')->default(0);
            $table->integer('no_pay_days')->default(0);
            
            $table->enum('status', ['pending', 'approved', 'paid'])->default('pending');
            $table->timestamps();
            
            $table->index('payroll_run_id');
            $table->index('user_id');
            $table->index('branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_items');
        Schema::dropIfExists('payroll_runs');
        Schema::dropIfExists('statutory_config');
        Schema::dropIfExists('salary_grades');
    }
};
