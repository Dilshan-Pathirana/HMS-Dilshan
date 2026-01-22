<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bonuses', function (Blueprint $table) {
            $table->id();
            $table->uuid('employee_id');
            $table->decimal('amount', 10, 2);
            $table->string('bonus_type', 50); // performance, festive, project_completion
            $table->text('reason')->nullable();
            $table->date('bonus_date');
            $table->uuid('approved_by')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['employee_id', 'bonus_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bonuses');
    }
};
