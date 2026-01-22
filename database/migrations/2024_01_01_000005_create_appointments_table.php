<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_id');
            $table->uuid('doctor_id');
            $table->unsignedBigInteger('center_id');
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->enum('appointment_type', ['consultation', 'follow_up', 'emergency', 'routine_checkup']);
            $table->enum('status', [
                'booked',
                'checked_in',
                'in_session',
                'completed',
                'canceled',
                'no_show',
                'rescheduled'
            ])->default('booked');
            $table->decimal('booking_fee', 8, 2)->default(0);
            $table->enum('payment_status', ['pending', 'paid', 'refunded'])->default('pending');
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('doctor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('center_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index('appointment_date');
            $table->index('status');
            $table->index(['doctor_id', 'appointment_date']);
            $table->index(['patient_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
