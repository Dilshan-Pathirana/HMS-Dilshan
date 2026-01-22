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
        // Drop the old table and create a new one with UUID support
        Schema::dropIfExists('doctor_schedules');
        
        Schema::create('doctor_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('doctor_id');
            $table->string('branch_id')->nullable();
            $table->string('center_id')->nullable(); // Keep for backward compatibility
            $table->string('schedule_day')->nullable(); // e.g., "Monday", "Tuesday"
            $table->date('date')->nullable(); // Keep for backward compatibility
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->integer('max_patients')->default(20);
            $table->integer('max_sessions')->default(20); // Keep for backward compatibility
            $table->integer('time_per_patient')->default(15);
            $table->boolean('is_available')->default(true);
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['doctor_id', 'schedule_day']);
            $table->index(['doctor_id', 'branch_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the original table structure
        Schema::dropIfExists('doctor_schedules');
        
        Schema::create('doctor_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('doctor_id');
            $table->unsignedBigInteger('center_id');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('max_sessions')->default(20);
            $table->boolean('is_available')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
};
