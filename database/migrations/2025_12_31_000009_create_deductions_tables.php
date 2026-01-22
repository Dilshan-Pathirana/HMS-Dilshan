<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * STEP 15: Deductions Table
     * Manages various deductions: loans, advances, no-pay, etc.
     */
    public function up(): void
    {
        // Deduction types configuration
        Schema::create('deduction_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('deduction_category', ['loan', 'advance', 'no_pay', 'union_fee', 'welfare', 'insurance', 'penalty', 'other'])->default('other');
            $table->boolean('is_recurring')->default(false);
            $table->boolean('is_percentage')->default(false);
            $table->decimal('max_percentage', 5, 2)->nullable(); // Max % of salary that can be deducted
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0); // Order of deduction
            $table->timestamps();
        });

        // Employee deductions
        Schema::create('employee_deductions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('deduction_type_id');
            $table->decimal('total_amount', 12, 2)->nullable(); // For loans/advances - total loan amount
            $table->decimal('monthly_amount', 12, 2); // Monthly deduction amount
            $table->decimal('balance_amount', 12, 2)->nullable(); // Remaining balance for loans
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->integer('total_installments')->nullable();
            $table->integer('completed_installments')->default(0);
            $table->enum('status', ['active', 'completed', 'suspended', 'cancelled'])->default('active');
            $table->text('reason')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('deduction_type_id')->references('id')->on('deduction_types')->onDelete('cascade');
            $table->index(['user_id', 'status']);
            $table->index(['deduction_type_id', 'status']);
        });

        // Deduction transactions (history)
        Schema::create('deduction_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_deduction_id');
            $table->uuid('payroll_item_id')->nullable();
            $table->date('deduction_date');
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_after', 12, 2)->nullable();
            $table->integer('installment_number')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('employee_deduction_id')->references('id')->on('employee_deductions')->onDelete('cascade');
            $table->index(['employee_deduction_id', 'deduction_date'], 'deduction_trans_emp_date_index');
        });

        // Seed default deduction types for Sri Lanka
        DB::table('deduction_types')->insert([
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'LOAN',
                'name' => 'Staff Loan',
                'description' => 'Company staff loan deduction',
                'deduction_category' => 'loan',
                'is_recurring' => true,
                'is_percentage' => false,
                'max_percentage' => 50.00,
                'is_active' => true,
                'priority' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'ADVANCE',
                'name' => 'Salary Advance',
                'description' => 'Salary advance recovery',
                'deduction_category' => 'advance',
                'is_recurring' => false,
                'is_percentage' => false,
                'max_percentage' => 100.00,
                'is_active' => true,
                'priority' => 2,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'NO_PAY',
                'name' => 'No Pay Leave',
                'description' => 'No pay leave deduction',
                'deduction_category' => 'no_pay',
                'is_recurring' => false,
                'is_percentage' => false,
                'max_percentage' => null,
                'is_active' => true,
                'priority' => 3,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'WELFARE',
                'name' => 'Welfare Fund',
                'description' => 'Monthly welfare fund contribution',
                'deduction_category' => 'welfare',
                'is_recurring' => true,
                'is_percentage' => false,
                'max_percentage' => null,
                'is_active' => true,
                'priority' => 4,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'INSURANCE',
                'name' => 'Life Insurance',
                'description' => 'Life insurance premium deduction',
                'deduction_category' => 'insurance',
                'is_recurring' => true,
                'is_percentage' => false,
                'max_percentage' => null,
                'is_active' => true,
                'priority' => 5,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deduction_transactions');
        Schema::dropIfExists('employee_deductions');
        Schema::dropIfExists('deduction_types');
    }
};
