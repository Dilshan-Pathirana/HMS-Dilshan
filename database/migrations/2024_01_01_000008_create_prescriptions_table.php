<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('doctor_id');
            $table->unsignedBigInteger('medication_id');
            $table->string('dosage', 100); // e.g., "1 tablet"
            $table->string('frequency', 100); // e.g., "3 times daily"
            $table->integer('duration'); // in days
            $table->text('notes')->nullable();
            $table->boolean('is_dispensed')->default(false);
            $table->timestamps();

            $table->foreign('session_id')->references('id')->on('sessions')->onDelete('cascade');
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('doctor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('medication_id')->references('id')->on('medications')->onDelete('restrict');
            
            $table->index('session_id');
            $table->index('patient_id');
            $table->index('is_dispensed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
