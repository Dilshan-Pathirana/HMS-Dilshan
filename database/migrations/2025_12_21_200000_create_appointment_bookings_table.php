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
        Schema::create('appointment_bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Core relationships
            $table->uuid('patient_id'); // References patients table
            $table->uuid('doctor_id'); // References users table (doctor)
            $table->uuid('branch_id'); // References branches table
            $table->uuid('schedule_id')->nullable(); // References doctor_schedules table
            
            // Appointment details
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->integer('slot_number')->nullable(); // Token/slot number
            $table->integer('token_number')->nullable(); // Queue token number
            
            // Appointment type
            $table->string('appointment_type')->default('consultation'); // consultation, follow_up, emergency, routine_checkup
            $table->string('booking_type')->default('online'); // online, walk_in
            
            // Status tracking
            $table->string('status')->default('pending_payment'); 
            // pending_payment, confirmed, checked_in, in_session, completed, cancelled, no_show, rescheduled
            
            // Payment information
            $table->string('payment_status')->default('pending'); // pending, paid, refunded, waived
            $table->string('payment_method')->nullable(); // paypal, cash, card, manual
            $table->string('payment_id')->nullable(); // PayPal transaction ID
            $table->decimal('booking_fee', 10, 2)->default(0);
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->timestamp('payment_date')->nullable();
            
            // Booking metadata
            $table->uuid('booked_by')->nullable(); // User who created the booking (for walk-ins)
            $table->string('booked_by_role')->nullable(); // patient, receptionist, branch_admin
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->uuid('cancelled_by')->nullable();
            
            // Rescheduling
            $table->integer('reschedule_count')->default(0);
            $table->uuid('original_appointment_id')->nullable(); // If rescheduled
            
            // Timestamps
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('session_started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            
            // Indexes for common queries
            $table->index(['doctor_id', 'appointment_date']);
            $table->index(['patient_id', 'status']);
            $table->index(['branch_id', 'appointment_date']);
            $table->index(['status', 'appointment_date']);
            $table->index('appointment_date');
            $table->index('token_number');
            
            // Unique constraint to prevent double booking
            $table->unique(['doctor_id', 'appointment_date', 'slot_number'], 'unique_doctor_slot');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_bookings');
    }
};
