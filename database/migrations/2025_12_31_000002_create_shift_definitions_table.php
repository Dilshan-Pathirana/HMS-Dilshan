<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * STEP 4: Shift Definitions Table
     */
    public function up(): void
    {
        Schema::create('shift_definitions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('branch_id')->nullable();
            $table->string('shift_name'); // Morning, Afternoon, Night, Split, etc.
            $table->string('shift_code')->nullable(); // M, A, N, S
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('standard_hours', 4, 2)->default(8.00);
            $table->decimal('break_duration', 4, 2)->default(1.00); // In hours
            $table->boolean('overnight_shift')->default(false); // Crosses midnight
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->json('applicable_roles')->nullable(); // Which roles can be assigned this shift
            $table->json('applicable_days')->nullable(); // Which days of week this shift is available
            $table->timestamps();
            
            $table->index('branch_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_definitions');
    }
};
