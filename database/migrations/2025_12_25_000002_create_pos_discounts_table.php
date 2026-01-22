<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Enhanced discount system supporting:
     * - Item-level discounts
     * - Bill-level discounts
     * - Period-based discounts
     * - Category discounts
     */
    public function up(): void
    {
        Schema::create('pos_discounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Discount identification
            $table->string('name');
            $table->string('code')->unique()->nullable(); // Promo code if applicable
            $table->text('description')->nullable();
            
            // Discount scope: item, category, bill
            $table->enum('scope', ['item', 'category', 'bill'])->default('item');
            
            // Discount type: percentage or fixed
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 10, 2); // Percentage or fixed amount
            
            // Applicable to (for item/category scope)
            $table->foreignUuid('product_id')->nullable()->constrained('products')->onDelete('cascade');
            $table->string('category')->nullable(); // For category-based discounts
            
            // Validity period
            $table->datetime('valid_from')->nullable();
            $table->datetime('valid_until')->nullable();
            $table->boolean('is_period_based')->default(false);
            
            // Conditions
            $table->decimal('min_purchase_amount', 10, 2)->nullable(); // Minimum bill amount
            $table->decimal('min_quantity', 10, 2)->nullable(); // Minimum quantity for item discount
            $table->decimal('max_discount_amount', 10, 2)->nullable(); // Cap on discount
            
            // Branch-specific or global
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->onDelete('cascade');
            $table->boolean('is_global')->default(false); // Applies to all branches
            
            // Role-based permissions
            $table->boolean('cashier_can_apply')->default(true);
            $table->boolean('requires_approval')->default(false);
            
            // Priority (lower = higher priority)
            $table->integer('priority')->default(100);
            
            // Stacking rules
            $table->boolean('can_stack')->default(false); // Can combine with other discounts
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Audit
            $table->foreignUuid('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Indexes
            $table->index(['scope', 'is_active']);
            $table->index(['valid_from', 'valid_until']);
            $table->index(['branch_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_discounts');
    }
};
