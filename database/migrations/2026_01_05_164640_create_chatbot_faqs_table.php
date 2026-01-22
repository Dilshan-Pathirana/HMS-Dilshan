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
        Schema::create('chatbot_faqs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('category', 50); // general_homeopathy, doctor_info, hospital_info, appointment, admin_faq
            $table->text('question');
            $table->text('answer');
            $table->json('keywords')->nullable(); // Keywords for matching
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0); // Higher priority = shown first
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->index('category');
            $table->index('is_active');
        });

        // Create chatbot logs table for learning/improvement
        Schema::create('chatbot_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('question');
            $table->string('category_detected', 50)->nullable();
            $table->text('response_given')->nullable();
            $table->boolean('was_helpful')->nullable();
            $table->string('session_id', 100)->nullable();
            $table->timestamps();

            $table->index('category_detected');
            $table->index('was_helpful');
        });

        // Create disease-specialization mapping table
        Schema::create('chatbot_disease_mappings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('disease_name', 100);
            $table->string('specialization', 100);
            $table->text('safe_response')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('disease_name');
            $table->index('specialization');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chatbot_disease_mappings');
        Schema::dropIfExists('chatbot_logs');
        Schema::dropIfExists('chatbot_faqs');
    }
};
