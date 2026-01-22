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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('po_number')->unique(); // PO-YYMMDD-0001
            $table->uuid('purchase_request_id')->nullable();
            $table->uuid('branch_id');
            $table->unsignedBigInteger('pharmacy_id')->nullable();
            $table->uuid('supplier_id');
            $table->uuid('created_by');
            $table->enum('status', ['Draft', 'Sent', 'Confirmed', 'Partially_Delivered', 'Fully_Delivered', 'Closed', 'Cancelled'])->default('Draft');
            $table->date('order_date');
            $table->date('expected_delivery_date')->nullable();
            $table->date('actual_delivery_date')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('final_amount', 15, 2)->default(0);
            $table->text('terms_and_conditions')->nullable();
            $table->text('delivery_instructions')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('purchase_request_id')->references('id')->on('purchase_requests')->onDelete('set null');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('restrict');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
