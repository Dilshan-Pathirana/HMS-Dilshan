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
        Schema::create('employee_ot', function (Blueprint $table) {
            $table->uuid('id');
            $table->uuid('employee_id');
            $table->date('date');
            $table->decimal('hours_worked', 8, 2);
            $table->decimal('ot_rate', 10, 2);
            $table->decimal('total_ot_amount', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_ot');
    }
};
