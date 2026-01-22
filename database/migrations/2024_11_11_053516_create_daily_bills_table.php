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
        Schema::create('daily_bills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_id')->unique();
            $table->foreignUuid('user_id')->constrained('users');
            $table->decimal('discount_amount', 10, 2)->default(0)->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->decimal('amount_received', 10, 2);
            $table->decimal('remain_amount', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_bills');
    }
};
