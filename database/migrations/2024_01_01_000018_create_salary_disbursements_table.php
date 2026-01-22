<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_disbursements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('payroll_id');
            $table->unsignedBigInteger('employee_id');
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', ['cash', 'bank_transfer', 'check', 'online']);
            $table->string('transaction_id', 100)->nullable();
            $table->unsignedBigInteger('disbursed_by');
            $table->timestamp('disbursement_date');
            $table->enum('status', ['pending', 'completed', 'failed'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('payroll_id')->references('id')->on('payroll')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('disbursed_by')->references('id')->on('users')->onDelete('restrict');
            
            $table->index('disbursement_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_disbursements');
    }
};
