<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('center_id');
            $table->string('period', 7); // YYYY-MM format
            $table->decimal('base_salary', 10, 2);
            $table->decimal('overtime', 10, 2)->default(0);
            $table->decimal('bonuses', 10, 2)->default(0);
            $table->decimal('deductions', 10, 2)->default(0);
            $table->decimal('attendance_adjustment', 10, 2)->default(0);
            $table->decimal('gross_salary', 10, 2);
            $table->decimal('net_salary', 10, 2);
            $table->enum('status', ['pending', 'approved', 'disbursed', 'canceled'])->default('pending');
            $table->timestamp('generated_at');
            $table->timestamp('disbursed_at')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('center_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index(['employee_id', 'period']);
            $table->index('status');
            $table->unique(['employee_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll');
    }
};
