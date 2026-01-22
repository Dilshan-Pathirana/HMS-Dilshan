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
        Schema::create('staff_salary', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('branch_id');
            $table->decimal('basic_salary_amount', 10, 2);
            $table->decimal('allocation_amount', 10, 2)->nullable();
            $table->decimal('rate_for_hour', 10, 2)->nullable();
            $table->unsignedInteger('maximum_hours_can_work')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_salary');
    }
};
