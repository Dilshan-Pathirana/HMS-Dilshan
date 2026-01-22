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
        Schema::create('appointment_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('appointment_id'); // References appointment_bookings
            
            // Action details
            $table->string('action'); // created, confirmed, checked_in, completed, cancelled, rescheduled, modified, payment_received, etc.
            $table->string('previous_status')->nullable();
            $table->string('new_status')->nullable();
            
            // Who performed the action
            $table->uuid('performed_by'); // User ID
            $table->string('performed_by_role'); // patient, doctor, receptionist, branch_admin, super_admin, system
            
            // Additional details
            $table->text('reason')->nullable();
            $table->json('metadata')->nullable(); // Store any additional info as JSON
            
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            
            $table->timestamp('created_at');
            
            // Indexes
            $table->index('appointment_id');
            $table->index(['performed_by', 'action']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_logs');
    }
};
