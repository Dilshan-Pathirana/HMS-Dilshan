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
        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('purchase_request_id');
            $table->uuid('product_id');
            $table->uuid('supplier_id')->nullable();
            $table->integer('requested_quantity');
            $table->integer('suggested_quantity')->nullable();
            $table->decimal('estimated_unit_price', 10, 2)->nullable();
            $table->decimal('total_estimated_cost', 15, 2)->nullable();
            $table->text('item_remarks')->nullable();
            $table->boolean('is_suggested')->default(false); // From intelligent engine
            $table->string('suggestion_reason')->nullable(); // 'Low Stock', 'Zero Stock', 'Fast Moving'
            $table->timestamps();

            $table->foreign('purchase_request_id')->references('id')->on('purchase_requests')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_request_items');
    }
};
