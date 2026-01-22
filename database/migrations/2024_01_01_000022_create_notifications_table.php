<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->enum('type', [
                'appointment_reminder',
                'appointment_confirmation',
                'appointment_cancellation',
                'prescription_ready',
                'test_result_available',
                'payment_received',
                'reorder_alert',
                'system_notification',
                'general'
            ]);
            $table->string('title', 100);
            $table->text('message');
            $table->string('related_type', 50)->nullable(); // appointment, invoice, etc.
            $table->unsignedBigInteger('related_id')->nullable();
            $table->enum('status', ['pending', 'sent', 'failed', 'read'])->default('pending');
            $table->enum('channel', ['email', 'sms', 'push', 'in_app'])->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->index('user_id');
            $table->index(['user_id', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
