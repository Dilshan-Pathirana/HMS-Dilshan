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
        Schema::table('chatbot_faqs', function (Blueprint $table) {
            // Rename existing columns to English versions
            $table->renameColumn('question', 'question_en');
            $table->renameColumn('answer', 'answer_en');
        });

        Schema::table('chatbot_faqs', function (Blueprint $table) {
            // Add Sinhala columns
            $table->string('question_si')->nullable()->after('question_en');
            $table->text('answer_si')->nullable()->after('answer_en');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chatbot_faqs', function (Blueprint $table) {
            $table->dropColumn(['question_si', 'answer_si']);
        });

        Schema::table('chatbot_faqs', function (Blueprint $table) {
            $table->renameColumn('question_en', 'question');
            $table->renameColumn('answer_en', 'answer');
        });
    }
};
