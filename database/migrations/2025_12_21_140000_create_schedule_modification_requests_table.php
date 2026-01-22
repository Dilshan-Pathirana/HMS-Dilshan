<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schedule_modification_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('doctor_id');
            $table->uuid('branch_id');
            $table->uuid('schedule_id')->nullable(); // Reference to doctor_schedules if modifying a specific schedule
            
            // Type of modification request
            $table->enum('request_type', [
                'block_date',           // Block a specific date
                'block_schedule',       // Block/disable a recurring schedule
                'delay_start',          // Delay the start time of a schedule
                'limit_appointments',   // Reduce max appointments for a date
                'early_end'             // End schedule early on a specific date
            ]);
            
            // Date range for the modification
            $table->date('start_date');
            $table->date('end_date')->nullable(); // For multi-day blocks
            
            // Modification details
            $table->time('new_start_time')->nullable(); // For delay_start
            $table->time('new_end_time')->nullable();   // For early_end
            $table->integer('new_max_patients')->nullable(); // For limit_appointments
            
            // Request details
            $table->text('reason');
            $table->string('status')->default('pending'); // pending, approved, rejected
            
            // Approval details
            $table->uuid('approved_by')->nullable();
            $table->text('approval_notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['doctor_id', 'status']);
            $table->index(['branch_id', 'status']);
            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_modification_requests');
    }
};
