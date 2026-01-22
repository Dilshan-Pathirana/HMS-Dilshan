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
        Schema::create('daily_cash_summaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('branch_id');
            $table->uuid('cashier_id'); // user_id of the cashier
            $table->date('summary_date');
            
            // Sales summary
            $table->integer('total_transactions')->default(0);
            $table->decimal('total_sales', 10, 2)->default(0);
            
            // Payment mode breakdown
            $table->decimal('cash_total', 10, 2)->default(0);
            $table->integer('cash_count')->default(0);
            $table->decimal('card_total', 10, 2)->default(0);
            $table->integer('card_count')->default(0);
            $table->decimal('online_total', 10, 2)->default(0);
            $table->integer('online_count')->default(0);
            $table->decimal('qr_total', 10, 2)->default(0);
            $table->integer('qr_count')->default(0);
            
            // Cash movement
            $table->decimal('cash_in_total', 10, 2)->default(0); // From cash_entries (CASH_IN)
            $table->decimal('cash_out_total', 10, 2)->default(0); // From cash_entries (CASH_OUT)
            
            // Expected vs Actual
            $table->decimal('expected_cash_balance', 10, 2)->default(0); // cash_total + cash_in - cash_out
            $table->decimal('actual_cash_counted', 10, 2)->nullable();
            $table->decimal('cash_variance', 10, 2)->default(0); // actual - expected
            $table->text('variance_remarks')->nullable();
            
            // EOD status
            $table->string('eod_status')->default('OPEN'); // 'OPEN', 'SUBMITTED', 'APPROVED', 'LOCKED'
            $table->timestamp('submitted_at')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            
            // Audit fields
            $table->timestamps();
            
            // Unique constraint: one summary per cashier per day
            $table->unique(['branch_id', 'cashier_id', 'summary_date']);
            
            // Indexes
            $table->index('branch_id');
            $table->index('cashier_id');
            $table->index('summary_date');
            $table->index('eod_status');
            $table->index(['branch_id', 'summary_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_cash_summaries');
    }
};
