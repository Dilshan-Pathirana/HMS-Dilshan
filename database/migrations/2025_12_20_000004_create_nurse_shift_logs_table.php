<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nurse_shift_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('nurse_id');
            $table->unsignedBigInteger('branch_id');
            $table->string('ward')->nullable();
            
            $table->date('shift_date');
            $table->enum('shift_type', ['morning', 'afternoon', 'night']);
            $table->time('scheduled_start');
            $table->time('scheduled_end');
            
            // Actual times
            $table->timestamp('actual_start')->nullable();
            $table->timestamp('actual_end')->nullable();
            
            // Status
            $table->enum('status', ['scheduled', 'started', 'completed', 'missed', 'cancelled'])->default('scheduled');
            
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('nurse_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('branch_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index(['nurse_id', 'shift_date']);
            $table->index(['branch_id', 'ward', 'shift_date']);
            $table->index('status');
            $table->unique(['nurse_id', 'shift_date', 'shift_type'], 'unique_nurse_shift');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nurse_shift_logs');
    }
};
