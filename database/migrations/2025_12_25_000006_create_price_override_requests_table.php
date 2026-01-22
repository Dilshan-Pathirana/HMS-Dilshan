<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Track price override approval requests
     * Used when cashier needs to sell below minimum price
     */
    public function up(): void
    {
        Schema::create('price_override_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Transaction context (pending or completed)
            $table->uuid('pending_transaction_id')->nullable(); // Before approval
            $table->foreignUuid('transaction_id')->nullable()->constrained('billing_transactions')->onDelete('set null');
            
            // Product and pricing
            $table->foreignUuid('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignUuid('batch_id')->nullable()->constrained('inventory_batches')->onDelete('set null');
            
            $table->decimal('original_price', 10, 2);
            $table->decimal('requested_price', 10, 2);
            $table->decimal('min_allowed_price', 10, 2);
            $table->integer('quantity');
            
            // Reason for override
            $table->text('reason');
            
            // Branch context
            $table->foreignUuid('branch_id')->constrained('branches')->onDelete('cascade');
            
            // Requested by (Cashier)
            $table->foreignUuid('requested_by')->constrained('users')->onDelete('cascade');
            
            // Approval status
            $table->enum('status', ['pending', 'approved', 'denied', 'expired'])->default('pending');
            
            // Approver (Branch Admin / Super Admin)
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            
            // PIN verification (for quick approvals)
            $table->string('approval_pin_hash')->nullable();
            
            // Expiry (requests expire after certain time)
            $table->timestamp('expires_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['status', 'branch_id']);
            $table->index(['requested_by', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_override_requests');
    }
};
