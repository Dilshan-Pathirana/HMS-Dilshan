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
        Schema::create('appointment_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('branch_id')->unique(); // One settings per branch
            
            // Advance booking limits
            $table->integer('max_advance_booking_days')->default(30); // How many days ahead can book
            $table->integer('min_advance_booking_hours')->default(1); // Minimum hours before appointment
            
            // Session limits
            $table->integer('default_max_patients_per_session')->default(20);
            $table->integer('default_time_per_patient')->default(15); // minutes
            
            // Booking rules
            $table->boolean('allow_walk_in')->default(true);
            $table->boolean('require_payment_for_online')->default(true);
            $table->boolean('allow_cash_payment')->default(true);
            $table->boolean('allow_reschedule')->default(true);
            $table->integer('max_reschedule_count')->default(1);
            $table->integer('reschedule_advance_hours')->default(24); // Hours before appointment
            
            // Cancellation rules
            $table->boolean('allow_patient_cancellation')->default(true);
            $table->integer('cancellation_advance_hours')->default(24);
            $table->boolean('refund_on_cancellation')->default(true);
            $table->decimal('cancellation_fee_percentage', 5, 2)->default(0);
            
            // Fees
            $table->decimal('default_booking_fee', 10, 2)->default(500.00);
            $table->decimal('walk_in_fee', 10, 2)->default(0);
            
            // Notification settings
            $table->boolean('send_sms_confirmation')->default(true);
            $table->boolean('send_sms_reminder')->default(true);
            $table->integer('reminder_hours_before')->default(24);
            $table->boolean('send_email_confirmation')->default(true);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_settings');
    }
};
