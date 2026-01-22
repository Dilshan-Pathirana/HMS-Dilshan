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
        Schema::create('goods_receiving_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('grn_number')->unique(); // GRN-YYMMDD-0001
            $table->uuid('purchase_order_id');
            $table->uuid('branch_id');
            $table->uuid('pharmacy_id')->nullable();
            $table->uuid('received_by'); // pharmacist user id
            $table->date('received_date');
            $table->string('supplier_invoice_number')->nullable();
            $table->date('supplier_invoice_date')->nullable();
            $table->string('delivery_note_number')->nullable();
            $table->enum('status', ['Draft', 'Completed', 'Partially_Received'])->default('Draft');
            $table->decimal('total_received_value', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->boolean('has_discrepancies')->default(false);
            $table->text('discrepancy_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            $table->foreign('received_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receiving_notes');
    }
};
