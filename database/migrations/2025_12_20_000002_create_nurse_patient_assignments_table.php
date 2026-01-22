<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nurse_patient_assignments', function (Blueprint $table) {
            $table->id();
            $table->uuid('nurse_id');
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('branch_id');
            $table->string('ward')->nullable(); // Ward/Unit assignment
            
            $table->date('assigned_date');
            $table->enum('shift', ['morning', 'afternoon', 'night'])->default('morning');
            $table->boolean('is_primary')->default(false); // Primary nurse for this patient
            $table->boolean('is_active')->default(true);
            
            $table->uuid('assigned_by')->nullable(); // Who made the assignment
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('nurse_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('branch_id')->references('id')->on('medical_centers')->onDelete('cascade');
            $table->foreign('assigned_by')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['nurse_id', 'assigned_date', 'is_active']);
            $table->index(['patient_id', 'is_active']);
            $table->index(['branch_id', 'ward']);
            $table->unique(['nurse_id', 'patient_id', 'assigned_date', 'shift'], 'unique_nurse_patient_shift');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nurse_patient_assignments');
    }
};
