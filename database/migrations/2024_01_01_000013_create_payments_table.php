<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoice_id');
            $table->unsignedBigInteger('session_id')->nullable();
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('center_id');
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', [
                'cash',
                'credit_card',
                'debit_card',
                'bank_transfer',
                'online',
                'insurance'
            ]);
            $table->string('transaction_id', 100)->nullable();
            $table->timestamp('payment_date');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('completed');
            $table->string('receipt_number', 50)->unique();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
            $table->foreign('session_id')->references('id')->on('medical_sessions')->onDelete('set null');
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('center_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index('payment_date');
            $table->index('status');
            $table->index('receipt_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
