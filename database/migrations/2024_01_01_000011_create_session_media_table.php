<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_media', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->enum('file_type', ['image', 'video', 'document', 'audio']);
            $table->string('file_url', 255);
            $table->string('file_name', 100)->nullable();
            $table->integer('file_size')->nullable(); // in KB
            $table->text('description')->nullable();
            $table->uuid('uploaded_by');
            $table->timestamp('upload_date');
            $table->timestamps();

            $table->foreign('session_id')->references('id')->on('medical_sessions')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('restrict');
            
            $table->index('session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_media');
    }
};
