<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deductions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->decimal('amount', 10, 2);
            $table->string('deduction_type', 50); // tax, insurance, loan, advance
            $table->text('reason')->nullable();
            $table->date('deduction_date');
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->index(['employee_id', 'deduction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deductions');
    }
};
