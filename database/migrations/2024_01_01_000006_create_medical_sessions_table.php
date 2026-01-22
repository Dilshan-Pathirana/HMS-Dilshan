<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('appointment_id');
            $table->uuid('patient_id');
            $table->uuid('doctor_id');
            $table->unsignedBigInteger('center_id');
            $table->date('session_date');
            $table->time('session_time');
            $table->text('diagnosis')->nullable();
            $table->text('observations')->nullable(); // JSON format
            $table->text('session_notes')->nullable();
            $table->decimal('consultation_fee', 8, 2)->default(0);
            $table->enum('status', ['ongoing', 'completed', 'canceled'])->default('ongoing');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->foreign('appointment_id')->references('id')->on('appointments')->onDelete('cascade');
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('doctor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('center_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index('session_date');
            $table->index('status');
            $table->index(['patient_id', 'session_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_sessions');
    }
};
