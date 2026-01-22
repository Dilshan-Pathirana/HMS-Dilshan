<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Salary Structures / Pay Grades for HRM Module
     * Sri Lanka Compliant: EPF/ETF applicable flag
     */
    public function up(): void
    {
        Schema::create('salary_structures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('grade_code', 10)->unique(); // G1, G2, G3, etc.
            $table->string('title'); // Executive, Senior Staff, Doctor, etc.
            $table->string('description')->nullable();
            
            // Salary Range (LKR)
            $table->decimal('min_salary', 12, 2);
            $table->decimal('max_salary', 12, 2);
            
            // Allowances (stored as JSON for flexibility)
            $table->decimal('medical_allowance', 10, 2)->default(0);
            $table->decimal('transport_allowance', 10, 2)->default(0);
            $table->decimal('housing_allowance', 10, 2)->default(0);
            $table->decimal('meal_allowance', 10, 2)->default(0);
            $table->decimal('other_allowance', 10, 2)->default(0);
            
            // Statutory Deductions
            $table->boolean('epf_applicable')->default(true); // EPF: 8% Employee + 12% Employer
            $table->boolean('etf_applicable')->default(true); // ETF: 3% Employer only
            
            // Overtime Rates
            $table->decimal('overtime_rate_multiplier', 3, 2)->default(1.50); // 1.5x, 2x, etc.
            $table->decimal('holiday_rate_multiplier', 3, 2)->default(2.00); // Double pay for holidays
            
            // Status
            $table->enum('status', ['Active', 'Inactive'])->default('Active');
            
            // Audit fields
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_structures');
    }
};
