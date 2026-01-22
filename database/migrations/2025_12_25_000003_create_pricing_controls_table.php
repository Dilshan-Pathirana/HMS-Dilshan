<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Centralized pricing control for products
     * Defines selling price boundaries and discount limits
     */
    public function up(): void
    {
        Schema::create('pricing_controls', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products')->onDelete('cascade');
            
            // Default pricing (centralized control)
            $table->decimal('default_selling_price', 10, 2);
            $table->decimal('min_selling_price', 10, 2); // Cannot sell below this
            $table->decimal('max_selling_price', 10, 2)->nullable(); // Optional ceiling
            
            // Discount limits
            $table->decimal('max_discount_percentage', 5, 2)->default(0); // Max % discount allowed
            $table->decimal('max_discount_amount', 10, 2)->nullable(); // Max fixed discount
            
            // Margin protection
            $table->decimal('min_margin_percentage', 5, 2)->nullable(); // Minimum profit margin required
            
            // Override settings
            $table->boolean('allow_manual_price')->default(false); // Can cashier enter custom price
            $table->boolean('requires_approval_below_min')->default(true); // Need approval if below min
            
            // Branch-specific or global
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->onDelete('cascade');
            $table->boolean('is_global')->default(true); // Applies to all branches if true
            
            // Audit
            $table->foreignUuid('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Indexes
            $table->unique(['product_id', 'branch_id']);
            $table->index(['is_global']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_controls');
    }
};
