<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deletion_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->string('entity_type', 50);
            $table->unsignedBigInteger('entity_id');
            $table->text('deleted_data'); // JSON - preserve all data
            $table->text('reason');
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('deleted_at');
            $table->timestamp('created_at');

            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
            
            $table->index(['entity_type', 'entity_id']);
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deletion_logs');
    }
};
