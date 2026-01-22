<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This table stores schedule overrides for specific dates (approved changes, time off, cancellations)
     */
    public function up(): void
    {
        Schema::create('employee_schedule_overrides', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('branch_id');
            $table->uuid('schedule_change_request_id')->nullable(); // Link to the original request
            $table->date('override_date'); // The specific date this override applies to
            $table->enum('override_type', ['shift_change', 'time_off', 'cancellation', 'interchange'])->default('shift_change');
            
            // Original schedule info
            $table->string('original_shift_type')->nullable();
            $table->time('original_start_time')->nullable();
            $table->time('original_end_time')->nullable();
            
            // New/overridden schedule info (null for time_off/cancellation)
            $table->string('new_shift_type')->nullable();
            $table->time('new_start_time')->nullable();
            $table->time('new_end_time')->nullable();
            
            // For shift interchange
            $table->uuid('interchange_with_user_id')->nullable();
            
            $table->text('reason')->nullable();
            $table->enum('status', ['active', 'expired', 'reverted'])->default('active');
            $table->uuid('approved_by')->nullable();
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            $table->index(['user_id', 'override_date']);
            $table->index(['branch_id', 'override_date']);
            $table->index(['override_date', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_schedule_overrides');
    }
};
