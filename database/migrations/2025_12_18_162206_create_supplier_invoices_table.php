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
        Schema::create('supplier_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_number')->unique();
            $table->uuid('purchase_order_id');
            $table->uuid('grn_id')->nullable();
            $table->uuid('supplier_id');
            $table->uuid('branch_id');
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->decimal('invoice_amount', 15, 2);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('balance_amount', 15, 2);
            $table->enum('payment_status', ['Pending', 'Partially_Paid', 'Paid', 'Overdue'])->default('Pending');
            $table->enum('invoice_status', ['Draft', 'Sent', 'Received', 'Verified', 'Dispute'])->default('Received');
            $table->boolean('has_discrepancy')->default(false);
            $table->text('discrepancy_notes')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
            $table->foreign('grn_id')->references('id')->on('goods_receiving_notes')->onDelete('set null');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('restrict');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_invoices');
    }
};
