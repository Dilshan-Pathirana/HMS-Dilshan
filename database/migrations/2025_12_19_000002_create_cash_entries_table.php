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
        Schema::create('cash_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('branch_id');
            $table->uuid('cashier_id'); // user_id of the cashier
            
            // Entry details
            $table->string('entry_type'); // 'CASH_IN', 'CASH_OUT'
            $table->string('category'); // 'PETTY_CASH', 'COURIER', 'EMERGENCY_PURCHASE', 'ADVANCE_PAYMENT', 'MISC_COLLECTION', 'ADJUSTMENT'
            $table->decimal('amount', 10, 2);
            $table->date('entry_date');
            
            // Description and approval
            $table->text('description');
            $table->string('reference_number')->nullable();
            $table->text('remarks')->nullable();
            $table->string('approval_status')->default('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED'
            $table->uuid('approved_by')->nullable(); // Branch admin or supervisor
            $table->timestamp('approved_at')->nullable();
            
            // EOD tracking
            $table->uuid('eod_summary_id')->nullable(); // Links to daily_cash_summaries
            $table->boolean('is_locked')->default(false); // True after EOD submission
            
            // Audit fields
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('branch_id');
            $table->index('cashier_id');
            $table->index('entry_date');
            $table->index('entry_type');
            $table->index('eod_summary_id');
            $table->index(['branch_id', 'entry_date']);
            $table->index(['cashier_id', 'entry_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_entries');
    }
};
