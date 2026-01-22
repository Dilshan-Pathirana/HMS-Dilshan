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
        Schema::create('user_resignations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->date('resignation_date');
            $table->date('last_working_date');
            $table->string('reason');
            $table->text('reason_details')->nullable();
            $table->decimal('final_salary', 10, 2)->default(0);
            $table->decimal('pending_leaves_payment', 10, 2)->default(0);
            $table->decimal('deductions', 10, 2)->default(0);
            $table->decimal('total_final_pay', 10, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('pending');
            $table->uuid('processed_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('processed_by')->references('id')->on('users')->onDelete('set null');
        });
        
        // Add resignation status to users table
        Schema::table('users', function (Blueprint $table) {
            $table->enum('employment_status', ['active', 'resigned', 'terminated', 'on_leave'])->default('active')->after('role_as');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('employment_status');
        });
        Schema::dropIfExists('user_resignations');
    }
};
