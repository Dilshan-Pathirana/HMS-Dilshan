<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * STEP 20: HRM Audit Logs
     */
    public function up(): void
    {
        Schema::create('hrm_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // Who performed the action
            $table->uuid('target_user_id')->nullable(); // Affected employee
            $table->uuid('branch_id')->nullable();
            $table->string('action_type'); // salary_change, leave_approved, payroll_generated, etc.
            $table->string('entity_type'); // user, leave, payroll, shift, etc.
            $table->uuid('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->text('description')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('target_user_id');
            $table->index('branch_id');
            $table->index('action_type');
            $table->index('entity_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hrm_audit_logs');
    }
};
