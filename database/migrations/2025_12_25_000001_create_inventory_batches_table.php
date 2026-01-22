<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Batch-based inventory for tracking different purchase prices
     * Supports FIFO, Weighted Average, and Manual batch selection
     */
    public function up(): void
    {
        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignUuid('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('batch_number')->unique();
            
            // Purchase information
            $table->decimal('purchase_price', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('original_quantity', 10, 2);
            $table->decimal('current_quantity', 10, 2);
            
            // Supplier and dates
            $table->foreignUuid('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->date('received_date');
            $table->date('expiry_date')->nullable();
            $table->date('manufacturing_date')->nullable();
            
            // Status tracking
            $table->enum('status', ['active', 'depleted', 'expired', 'damaged', 'returned'])->default('active');
            $table->decimal('low_stock_threshold', 10, 2)->default(10);
            
            // Reference to GRN if applicable
            $table->foreignUuid('grn_id')->nullable()->constrained('goods_receiving_notes')->onDelete('set null');
            
            // Metadata
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['product_id', 'branch_id', 'status']);
            $table->index(['expiry_date']);
            $table->index(['received_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_batches');
    }
};
