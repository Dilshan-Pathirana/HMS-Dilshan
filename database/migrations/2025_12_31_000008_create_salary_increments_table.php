<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * STEP 14: Salary Increments Table
     * Tracks salary increment history for each employee
     */
    public function up(): void
    {
        Schema::create('salary_increments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->decimal('previous_salary', 12, 2);
            $table->decimal('new_salary', 12, 2);
            $table->decimal('increment_amount', 12, 2);
            $table->decimal('increment_percentage', 5, 2)->nullable();
            $table->date('effective_date');
            $table->enum('increment_type', ['annual', 'promotion', 'performance', 'cost_of_living', 'special', 'other'])->default('annual');
            $table->string('reason')->nullable();
            $table->text('remarks')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'effective_date']);
            $table->index(['status', 'effective_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_increments');
    }
};
