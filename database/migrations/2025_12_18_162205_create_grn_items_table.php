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
        Schema::create('grn_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('grn_id');
            $table->uuid('purchase_order_item_id');
            $table->uuid('product_id');
            $table->integer('ordered_quantity');
            $table->integer('received_quantity');
            $table->integer('rejected_quantity')->default(0);
            $table->integer('damaged_quantity')->default(0);
            $table->string('batch_number')->nullable();
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('received_unit_price', 10, 2);
            $table->decimal('line_total', 15, 2);
            $table->enum('quality_status', ['Accepted', 'Rejected', 'Pending_QC'])->default('Accepted');
            $table->text('rejection_reason')->nullable();
            $table->text('item_notes')->nullable();
            $table->timestamps();

            $table->foreign('grn_id')->references('id')->on('goods_receiving_notes')->onDelete('cascade');
            $table->foreign('purchase_order_item_id')->references('id')->on('purchase_order_items')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grn_items');
    }
};
