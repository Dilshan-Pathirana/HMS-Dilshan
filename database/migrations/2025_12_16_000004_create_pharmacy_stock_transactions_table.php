<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_inventory_id')->constrained('pharmacy_inventory')->onDelete('cascade');
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->onDelete('cascade');
            $table->enum('transaction_type', ['purchase', 'sale', 'return', 'adjustment', 'transfer', 'expired']);
            $table->integer('quantity'); // positive for additions, negative for reductions
            $table->integer('quantity_before');
            $table->integer('quantity_after');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_amount', 10, 2);
            $table->foreignUuid('performed_by')->constrained('users');
            $table->text('notes')->nullable();
            $table->string('reference_number', 50)->nullable(); // Invoice/PO number
            $table->foreignId('related_pharmacy_id')->nullable()->constrained('pharmacies'); // for transfers
            $table->timestamps();

            $table->index(['pharmacy_id', 'transaction_type', 'created_at'], 'pst_pharmacy_type_date_index');
            $table->index('reference_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_stock_transactions');
    }
};
