<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * STEP 18: HR Complaints/Grievances Table
     * Employee grievance submission and tracking system
     */
    public function up(): void
    {
        Schema::create('hr_complaints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('ticket_number', 30)->unique();
            $table->uuid('complainant_id'); // Employee filing complaint
            $table->uuid('against_id')->nullable(); // Person complaint is against (if applicable)
            $table->enum('complaint_type', [
                'harassment',
                'discrimination',
                'workplace_safety',
                'policy_violation',
                'salary_dispute',
                'leave_dispute',
                'workload',
                'bullying',
                'misconduct',
                'facilities',
                'other'
            ]);
            $table->string('subject');
            $table->text('description');
            $table->text('expected_resolution')->nullable();
            $table->date('incident_date')->nullable();
            $table->string('incident_location')->nullable();
            $table->json('witnesses')->nullable(); // Array of witness names/IDs
            $table->json('attachments')->nullable(); // Evidence files
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', [
                'submitted',
                'under_review',
                'investigation',
                'pending_response',
                'resolved',
                'closed',
                'escalated',
                'withdrawn'
            ])->default('submitted');
            $table->uuid('assigned_to')->nullable(); // HR officer handling
            $table->timestamp('assigned_at')->nullable();
            $table->text('investigation_notes')->nullable();
            $table->text('resolution_summary')->nullable();
            $table->date('resolution_date')->nullable();
            $table->enum('resolution_outcome', [
                'in_favor_complainant',
                'in_favor_respondent',
                'mutual_agreement',
                'no_action_required',
                'escalated_higher',
                'withdrawn'
            ])->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->boolean('is_confidential')->default(true);
            $table->integer('satisfaction_rating')->nullable(); // 1-5 rating after resolution
            $table->text('feedback')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('complainant_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['complainant_id', 'status']);
            $table->index(['status', 'priority']);
            $table->index(['assigned_to', 'status']);
        });

        // Complaint comments/updates
        Schema::create('hr_complaint_updates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('complaint_id');
            $table->uuid('user_id');
            $table->text('comment');
            $table->boolean('is_internal')->default(false); // Internal HR notes vs visible to complainant
            $table->enum('update_type', ['comment', 'status_change', 'assignment', 'escalation', 'document'])->default('comment');
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->json('attachments')->nullable();
            $table->timestamps();

            $table->foreign('complaint_id')->references('id')->on('hr_complaints')->onDelete('cascade');
            $table->index(['complaint_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hr_complaint_updates');
        Schema::dropIfExists('hr_complaints');
    }
};
