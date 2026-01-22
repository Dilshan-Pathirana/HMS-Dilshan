<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schedule_change_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('branch_id');
            $table->enum('request_type', ['change', 'interchange', 'time_off', 'cancellation'])->default('change');
            $table->date('original_shift_date');
            $table->string('original_shift_type')->nullable();
            $table->date('requested_shift_date')->nullable();
            $table->string('requested_shift_type')->nullable();
            $table->uuid('interchange_with')->nullable(); // User ID for interchange
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->uuid('responded_by')->nullable(); // Branch admin who responded
            $table->timestamp('responded_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->boolean('notified_to_admin')->default(false);
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            $table->index(['branch_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_change_requests');
    }
};
