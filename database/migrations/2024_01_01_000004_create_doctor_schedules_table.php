<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('doctor_id');
            $table->unsignedBigInteger('center_id');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('max_sessions')->default(20);
            $table->boolean('is_available')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('doctor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('center_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index(['doctor_id', 'date']);
            $table->index('is_available');
            $table->unique(['doctor_id', 'date', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_schedules');
    }
};
