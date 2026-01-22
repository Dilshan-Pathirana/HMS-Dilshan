<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_vital_signs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('nurse_id'); // User who recorded
            $table->unsignedBigInteger('branch_id');
            
            // Vital Signs
            $table->decimal('temperature', 5, 2)->nullable(); // °F or °C
            $table->string('temperature_unit', 5)->default('F'); // F or C
            $table->integer('blood_pressure_systolic')->nullable();
            $table->integer('blood_pressure_diastolic')->nullable();
            $table->integer('pulse_rate')->nullable(); // beats per minute
            $table->integer('respiration_rate')->nullable(); // breaths per minute
            $table->integer('oxygen_saturation')->nullable(); // SpO2 percentage
            $table->decimal('weight', 6, 2)->nullable(); // kg
            $table->decimal('height', 5, 2)->nullable(); // cm
            
            // Additional observations
            $table->text('notes')->nullable();
            $table->enum('pain_level', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])->nullable();
            $table->enum('consciousness_level', ['alert', 'verbal', 'pain', 'unresponsive'])->nullable();
            
            // Status flags
            $table->boolean('is_abnormal')->default(false);
            $table->text('abnormal_flags')->nullable(); // JSON of what's abnormal
            
            $table->timestamp('recorded_at');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('nurse_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('branch_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index(['patient_id', 'recorded_at']);
            $table->index(['nurse_id', 'recorded_at']);
            $table->index(['branch_id', 'recorded_at']);
            $table->index('is_abnormal');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_vital_signs');
    }
};
