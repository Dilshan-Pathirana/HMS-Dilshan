<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medications', function (Blueprint $table) {
            $table->id();
            $table->string('medication_name', 100);
            $table->string('generic_name', 100)->nullable();
            $table->string('brand_name', 100)->nullable();
            $table->string('dosage_form', 50); // tablet, capsule, syrup, injection
            $table->string('strength', 50)->nullable(); // e.g., "500mg", "10ml"
            $table->integer('quantity_in_stock')->default(0);
            $table->integer('reorder_level')->default(10);
            $table->date('expiration_date')->nullable();
            $table->decimal('price_per_unit', 8, 2);
            $table->decimal('discount', 5, 2)->default(0); // Percentage
            $table->decimal('selling_price', 8, 2);
            $table->unsignedBigInteger('center_id');
            $table->text('description')->nullable();
            $table->string('manufacturer', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('center_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index('medication_name');
            $table->index('center_id');
            $table->index('expiration_date');
            $table->index('is_active');
            $table->index(['quantity_in_stock', 'reorder_level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medications');
    }
};
