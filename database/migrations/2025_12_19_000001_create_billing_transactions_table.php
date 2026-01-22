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
        Schema::create('billing_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('branch_id');
            $table->uuid('cashier_id'); // user_id of the cashier
            $table->uuid('patient_id')->nullable();
            
            // Transaction details
            $table->string('transaction_type'); // 'OPD', 'LAB', 'PHARMACY', 'SERVICE'
            $table->string('invoice_number')->unique();
            $table->string('receipt_number')->unique();
            
            // Payment details
            $table->decimal('total_amount', 10, 2);
            $table->decimal('paid_amount', 10, 2);
            $table->decimal('balance_amount', 10, 2)->default(0);
            $table->string('payment_status'); // 'PAID', 'PARTIAL', 'PENDING'
            $table->string('payment_method'); // 'CASH', 'CARD', 'ONLINE', 'QR'
            
            // Service/Item details
            $table->text('service_details')->nullable(); // JSON of services/items
            $table->text('remarks')->nullable();
            
            // Patient info (denormalized for faster access)
            $table->string('patient_name')->nullable();
            $table->string('patient_phone')->nullable();
            
            // EOD tracking
            $table->date('transaction_date');
            $table->uuid('eod_summary_id')->nullable(); // Links to daily_cash_summaries
            $table->boolean('is_locked')->default(false); // True after EOD submission
            
            // Audit fields
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('branch_id');
            $table->index('cashier_id');
            $table->index('patient_id');
            $table->index('transaction_date');
            $table->index('invoice_number');
            $table->index('receipt_number');
            $table->index('eod_summary_id');
            $table->index(['branch_id', 'transaction_date']);
            $table->index(['cashier_id', 'transaction_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('billing_transactions');
    }
};
