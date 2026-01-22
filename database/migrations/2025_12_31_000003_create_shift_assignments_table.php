<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * STEP 5: Shift Assignments Table
     */
    public function up(): void
    {
        Schema::create('shift_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('shift_definition_id');
            $table->uuid('branch_id');
            $table->uuid('assigned_by'); // Who assigned this shift
            $table->date('effective_from');
            $table->date('effective_to')->nullable(); // Null means ongoing
            $table->enum('status', ['pending', 'acknowledged', 'active', 'completed', 'cancelled'])->default('pending');
            $table->dateTime('acknowledged_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('shift_definition_id');
            $table->index('branch_id');
            $table->index('effective_from');
            $table->index(['user_id', 'effective_from']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_assignments');
    }
};
