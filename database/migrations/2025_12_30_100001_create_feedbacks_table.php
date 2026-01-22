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
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('user_id'); // Who submitted the feedback
            $table->string('user_type'); // patient, doctor, nurse, staff, etc.
            $table->string('user_name');
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('branch_name')->nullable();
            $table->unsignedBigInteger('doctor_id')->nullable();
            $table->string('doctor_name')->nullable();
            $table->enum('category', ['service', 'facility', 'staff', 'medical', 'billing', 'general', 'suggestion', 'complaint'])->default('general');
            $table->string('subject');
            $table->text('description');
            $table->integer('rating')->nullable(); // 1-5 stars
            $table->enum('experience', ['positive', 'neutral', 'negative'])->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['pending', 'in-review', 'responded', 'resolved', 'closed'])->default('pending');
            $table->text('admin_response')->nullable();
            $table->unsignedBigInteger('responded_by')->nullable();
            $table->string('responded_by_name')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->text('internal_notes')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->boolean('is_flagged')->default(false);
            $table->string('flag_reason')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index(['user_type', 'status']);
            $table->index(['category', 'status']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};
