<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * STEP 6: Attendance Records Table
     */
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('branch_id');
            $table->uuid('shift_assignment_id')->nullable();
            $table->date('attendance_date');
            $table->time('clock_in')->nullable();
            $table->time('clock_out')->nullable();
            $table->decimal('scheduled_hours', 4, 2)->default(0);
            $table->decimal('actual_hours', 4, 2)->default(0);
            $table->decimal('overtime_hours', 4, 2)->default(0);
            $table->decimal('late_minutes', 5, 2)->default(0);
            $table->decimal('early_leave_minutes', 5, 2)->default(0);
            $table->enum('status', ['present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'weekend'])->default('present');
            $table->enum('clock_in_method', ['manual', 'biometric', 'app', 'shift_acknowledgment'])->default('manual');
            $table->text('notes')->nullable();
            $table->uuid('recorded_by')->nullable(); // For manual entries
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('branch_id');
            $table->index('attendance_date');
            $table->unique(['user_id', 'attendance_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
