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
        Schema::create('post_views', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id');
            $table->uuid('user_id')->nullable(); // Nullable for anonymous views
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('medical_posts')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['post_id', 'created_at']);
            $table->index(['user_id', 'post_id']);
        });

        Schema::create('post_likes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id');
            $table->uuid('user_id');
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('medical_posts')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->unique(['post_id', 'user_id']);
        });

        Schema::create('post_ratings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id');
            $table->uuid('user_id');
            $table->tinyInteger('rating')->unsigned(); // 1-5 stars
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('medical_posts')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->unique(['post_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_ratings');
        Schema::dropIfExists('post_likes');
        Schema::dropIfExists('post_views');
    }
};
