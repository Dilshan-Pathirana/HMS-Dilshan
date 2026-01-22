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
        Schema::create('post_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id');
            $table->uuid('patient_id');
            $table->text('question');
            $table->text('answer')->nullable();
            $table->uuid('answered_by')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->enum('status', ['pending', 'answered', 'hidden', 'removed'])->default('pending');
            $table->uuid('moderated_by')->nullable();
            $table->timestamp('moderated_at')->nullable();
            $table->string('moderation_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('post_id')->references('id')->on('medical_posts')->onDelete('cascade');
            $table->foreign('patient_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('answered_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('moderated_by')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['post_id', 'status']);
            $table->index(['patient_id', 'created_at']);
            $table->index(['answered_by', 'answered_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_questions');
    }
};
