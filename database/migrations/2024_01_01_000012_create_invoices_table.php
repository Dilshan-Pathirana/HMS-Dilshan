<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id')->nullable();
            $table->uuid('patient_id');
            $table->unsignedBigInteger('center_id');
            $table->date('invoice_date');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->enum('payment_status', [
                'pending',
                'partially_paid',
                'paid',
                'refunded',
                'canceled'
            ])->default('pending');
            $table->text('items')->nullable(); // JSON format
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('session_id')->references('id')->on('medical_sessions')->onDelete('set null');
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('center_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index('invoice_date');
            $table->index('payment_status');
            $table->index(['patient_id', 'payment_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
