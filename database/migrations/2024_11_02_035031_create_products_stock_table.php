<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products_stock', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products');
            $table->string('unit');
            $table->float('current_stock');
            $table->float('min_stock')->nullable();
            $table->float('reorder_level')->nullable();
            $table->float('reorder_quantity')->nullable();
            $table->float('unit_cost')->nullable();
            $table->float('unit_selling_price')->nullable();
            $table->date('expiry_date')->nullable();
            $table->date('entry_date')->nullable();
            $table->string('product_store_location')->nullable();
            $table->string('stock_status')->nullable();
            $table->date('stock_update_date')->nullable();
            $table->string('damaged_stock')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products_stock');
    }
};
