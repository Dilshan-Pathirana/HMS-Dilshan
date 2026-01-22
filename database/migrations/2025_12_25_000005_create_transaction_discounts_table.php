<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Track discounts applied to transactions
     * Links transactions to discounts for reporting
     */
    public function up(): void
    {
        Schema::create('transaction_discounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Transaction reference
            $table->foreignUuid('transaction_id')->constrained('billing_transactions')->onDelete('cascade');
            
            // Discount reference (null if manual discount)
            $table->foreignUuid('discount_id')->nullable()->constrained('pos_discounts')->onDelete('set null');
            
            // What was discounted
            $table->enum('applied_to', ['item', 'bill']);
            $table->foreignUuid('product_id')->nullable()->constrained('products')->onDelete('set null');
            $table->integer('item_index')->nullable(); // Position in cart if item-level
            
            // Discount details
            $table->enum('discount_type', ['percentage', 'fixed']);
            $table->decimal('discount_value', 10, 2); // Original value (% or amount)
            $table->decimal('discount_amount', 10, 2); // Actual amount deducted
            
            // Original amounts
            $table->decimal('original_amount', 10, 2);
            $table->decimal('final_amount', 10, 2);
            
            // Approval tracking
            $table->boolean('required_approval')->default(false);
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Applied by
            $table->foreignUuid('applied_by')->constrained('users')->onDelete('cascade');
            
            $table->timestamps();
            
            // Indexes
            $table->index(['transaction_id']);
            $table->index(['discount_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_discounts');
    }
};
