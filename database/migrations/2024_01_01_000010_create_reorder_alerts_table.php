<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reorder_alerts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('medication_id');
            $table->integer('current_stock');
            $table->timestamp('alert_date');
            $table->enum('status', ['pending', 'ordered', 'received', 'canceled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('medication_id')->references('id')->on('medications')->onDelete('cascade');
            
            $table->index(['medication_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reorder_alerts');
    }
};
