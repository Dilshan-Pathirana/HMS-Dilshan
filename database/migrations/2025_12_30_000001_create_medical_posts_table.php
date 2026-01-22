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
        Schema::create('medical_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('doctor_id');
            $table->string('title');
            $table->string('slug')->unique();
            $table->enum('category', ['success_story', 'medical_finding', 'video_vlog', 'research_article']);
            $table->text('short_description');
            $table->longText('content');
            $table->string('video_url')->nullable();
            $table->string('video_file_path')->nullable();
            $table->string('pdf_file_path')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->enum('visibility', ['public', 'patients_only', 'logged_in_only'])->default('public');
            $table->enum('status', ['draft', 'published', 'hidden', 'removed'])->default('draft');
            $table->integer('view_count')->default(0);
            $table->integer('like_count')->default(0);
            $table->integer('comment_count')->default(0);
            $table->integer('question_count')->default(0);
            $table->uuid('moderated_by')->nullable();
            $table->timestamp('moderated_at')->nullable();
            $table->string('moderation_reason')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('doctor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('moderated_by')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['category', 'status']);
            $table->index(['doctor_id', 'status']);
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_posts');
    }
};
