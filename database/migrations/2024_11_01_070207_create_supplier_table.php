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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('supplier_name');
            $table->string('contact_person')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('supplier_address')->nullable();
            $table->string('supplier_city')->nullable();
            $table->string('supplier_country')->nullable();
            $table->string('supplier_type')->nullable();
            $table->string('products_supplied')->nullable();
            $table->string('rating')->nullable();
            $table->string('discounts_agreements')->nullable();
            $table->string('return_policy')->nullable();
            $table->string('delivery_time')->nullable();
            $table->string('payment_terms')->nullable();
            $table->string('bank_details')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
