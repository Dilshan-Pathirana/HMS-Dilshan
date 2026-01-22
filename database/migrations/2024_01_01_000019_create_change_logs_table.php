<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('change_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->string('entity_type', 50); // patients, medications, appointments, etc.
            $table->unsignedBigInteger('entity_id');
            $table->string('action', 50); // create, update, delete
            $table->text('before_data')->nullable(); // JSON
            $table->text('after_data')->nullable(); // JSON
            $table->text('changes')->nullable(); // JSON - specific changes
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at');

            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
            
            $table->index(['entity_type', 'entity_id']);
            $table->index('created_at');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('change_logs');
    }
};
