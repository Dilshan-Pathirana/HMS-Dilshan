<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * EPF/ETF Configuration for Sri Lanka compliance
     */
    public function up(): void
    {
        Schema::create('epf_etf_config', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // EPF Rates (Employees' Provident Fund)
            $table->decimal('epf_employee_rate', 5, 2)->default(8.00); // 8% employee contribution
            $table->decimal('epf_employer_rate', 5, 2)->default(12.00); // 12% employer contribution
            
            // ETF Rate (Employees' Trust Fund)
            $table->decimal('etf_employer_rate', 5, 2)->default(3.00); // 3% employer only
            
            // Registration Numbers
            $table->string('epf_registration_number')->nullable();
            $table->string('etf_registration_number')->nullable();
            
            // Company Details for submissions
            $table->string('company_name')->nullable();
            $table->string('company_address')->nullable();
            $table->string('company_contact')->nullable();
            
            // Settings
            $table->date('effective_from')->default(now());
            $table->integer('payment_due_date')->default(15); // Day of month
            $table->boolean('auto_calculate')->default(true);
            $table->boolean('is_active')->default(true);
            
            // Audit
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        // EPF/ETF Rate History for auditing changes
        Schema::create('epf_etf_rate_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('config_id');
            
            $table->decimal('old_epf_employee_rate', 5, 2);
            $table->decimal('new_epf_employee_rate', 5, 2);
            $table->decimal('old_epf_employer_rate', 5, 2);
            $table->decimal('new_epf_employer_rate', 5, 2);
            $table->decimal('old_etf_employer_rate', 5, 2);
            $table->decimal('new_etf_employer_rate', 5, 2);
            
            $table->date('effective_from');
            $table->string('change_reason')->nullable();
            $table->uuid('changed_by')->nullable();
            $table->timestamps();
            
            $table->foreign('config_id')->references('id')->on('epf_etf_config')->cascadeOnDelete();
            $table->foreign('changed_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epf_etf_rate_history');
        Schema::dropIfExists('epf_etf_config');
    }
};
