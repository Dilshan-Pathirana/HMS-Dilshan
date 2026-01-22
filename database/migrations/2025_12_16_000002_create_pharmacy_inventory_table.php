<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->onDelete('cascade');
            $table->string('medication_name', 100);
            $table->string('generic_name', 100)->nullable();
            $table->string('dosage_form', 50); // tablet, capsule, syrup, injection, etc.
            $table->string('strength', 50); // e.g., "500mg", "10ml"
            $table->string('manufacturer', 100)->nullable();
            $table->string('supplier', 100)->nullable();
            $table->string('batch_number', 50);
            $table->date('expiration_date');
            $table->integer('quantity_in_stock')->default(0);
            $table->integer('reorder_level')->default(10);
            $table->decimal('unit_cost', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->string('storage_location', 50)->nullable(); // Shelf/Bin location
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['pharmacy_id', 'medication_name']);
            $table->index(['pharmacy_id', 'quantity_in_stock']);
            $table->index('expiration_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_inventory');
    }
};
