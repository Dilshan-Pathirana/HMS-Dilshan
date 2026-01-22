<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Comprehensive audit logging for POS operations
     * Tracks all price changes, discounts, stock movements
     */
    public function up(): void
    {
        Schema::create('pos_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Action categorization
            $table->enum('action_type', [
                'price_override',
                'discount_applied',
                'discount_created',
                'discount_modified',
                'stock_adjustment',
                'batch_created',
                'batch_depleted',
                'sale_completed',
                'sale_voided',
                'refund_processed',
                'price_control_changed',
                'manual_price_entry',
                'approval_requested',
                'approval_granted',
                'approval_denied'
            ]);
            
            // Reference to affected entity
            $table->string('entity_type'); // product, batch, transaction, discount
            $table->uuid('entity_id');
            
            // Transaction reference if applicable
            $table->uuid('transaction_id')->nullable();
            
            // Branch context
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            
            // User who performed action
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('user_role')->nullable();
            
            // Approver (if approval was required)
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            
            // Value tracking
            $table->decimal('old_value', 10, 2)->nullable();
            $table->decimal('new_value', 10, 2)->nullable();
            $table->decimal('amount_impact', 10, 2)->nullable(); // Financial impact
            
            // Details
            $table->json('details')->nullable(); // Additional context
            $table->text('reason')->nullable(); // Why was action taken
            
            // Request metadata
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            
            $table->timestamps();
            
            // Indexes for reporting
            $table->index(['action_type', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
            $table->index(['user_id', 'created_at']);
            $table->index(['branch_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_audit_logs');
    }
};
