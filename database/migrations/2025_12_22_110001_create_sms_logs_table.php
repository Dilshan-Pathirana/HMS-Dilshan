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
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type'); // appointment_cancellation, appointment_confirmation, reminder, etc.
            $table->string('recipient_type'); // patient, doctor, admin
            $table->uuid('recipient_id')->nullable(); // User ID or Patient ID
            $table->string('phone_number'); // Full phone number (for logging)
            $table->string('phone_masked'); // Masked phone (e.g., ****1234)
            $table->text('message'); // SMS content
            $table->uuid('related_id')->nullable(); // Related entity ID (e.g., appointment_id)
            $table->string('related_type')->nullable(); // Related entity type (e.g., appointment_booking)
            $table->string('gateway')->default('textware'); // SMS gateway used
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');
            $table->text('error_message')->nullable(); // Error details if failed
            $table->integer('retry_count')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('type');
            $table->index('recipient_id');
            $table->index('related_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
    }
};
