<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates tables for the Doctor-Patient Consultation Module
     */
    public function up(): void
    {
        // 1. Homeopathy Question Library (Materia Medica based)
        Schema::create('consultation_question_bank', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('question_text');
            $table->string('category'); // general_symptoms, mental_state, physical_symptoms, modalities, aggravations_ameliorations
            $table->string('sub_category')->nullable();
            $table->string('answer_type')->default('text'); // text, scale, yes_no, multiple_choice
            $table->json('answer_options')->nullable(); // For multiple choice or scale options
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            
            $table->index('category');
            $table->index('is_active');
        });

        // 2. Diagnosis Master Table
        Schema::create('diagnosis_master', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('diagnosis_code')->nullable(); // ICD code if applicable
            $table->string('diagnosis_name');
            $table->text('description')->nullable();
            $table->string('category')->nullable(); // acute, chronic, constitutional
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            
            $table->index('diagnosis_name');
            $table->index('category');
            $table->index('is_active');
        });

        // 3. Consultations Table (Main consultation record)
        Schema::create('consultations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('appointment_id'); // Links to appointment_bookings
            $table->uuid('patient_id');
            $table->uuid('doctor_id');
            $table->uuid('branch_id');
            
            // Consultation timing
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            
            // Clinical notes
            $table->text('chief_complaint')->nullable();
            $table->text('clinical_notes')->nullable();
            $table->text('examination_findings')->nullable();
            $table->text('follow_up_instructions')->nullable();
            $table->date('follow_up_date')->nullable();
            
            // Fee
            $table->decimal('consultation_fee', 10, 2)->default(0);
            $table->boolean('is_free')->default(false);
            
            // Status tracking
            $table->string('status')->default('in_progress'); 
            // in_progress, completed, payment_pending, paid, medicines_issued
            $table->string('payment_status')->default('pending'); // pending, paid, waived
            $table->string('medicine_status')->default('pending'); // pending, issued, partial
            
            // Billing reference
            $table->string('billing_reference_id')->nullable();
            
            // Audit
            $table->uuid('submitted_by')->nullable();
            $table->timestamp('submitted_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['doctor_id', 'created_at']);
            $table->index(['patient_id', 'created_at']);
            $table->index('status');
            $table->index('payment_status');
            $table->index('billing_reference_id');
        });

        // 4. Consultation Questions & Answers
        Schema::create('consultation_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('consultation_id');
            $table->uuid('question_bank_id')->nullable(); // NULL for custom questions
            $table->text('question_text');
            $table->string('category')->nullable();
            $table->string('answer_type')->default('text');
            $table->text('answer_text')->nullable();
            $table->integer('answer_scale')->nullable(); // For scale answers (1-10)
            $table->boolean('answer_boolean')->nullable(); // For yes/no
            $table->json('answer_multiple')->nullable(); // For multiple choice
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index('consultation_id');
        });

        // 5. Consultation Diagnoses (Many-to-many with diagnosis_master)
        Schema::create('consultation_diagnoses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('consultation_id');
            $table->uuid('diagnosis_id');
            $table->string('diagnosis_type')->default('provisional'); // provisional, final
            $table->text('notes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index('consultation_id');
            $table->index('diagnosis_id');
        });

        // 6. Consultation Prescriptions (Medicine recommendations)
        Schema::create('consultation_prescriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('consultation_id');
            $table->uuid('product_id')->nullable(); // Links to products/pharmacy_inventory
            $table->string('medicine_name');
            $table->string('potency')->nullable(); // 6C, 30C, 200C, 1M, etc.
            $table->string('dosage'); // 2 pills, 5 drops, etc.
            $table->string('frequency'); // 3 times daily, once at night, etc.
            $table->string('duration'); // 7 days, 2 weeks, etc.
            $table->text('instructions')->nullable(); // Before food, after food, etc.
            $table->integer('quantity')->nullable(); // Quantity to dispense
            
            // Pricing (read-only from inventory)
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('total_price', 10, 2)->default(0);
            
            // Dispensing status (set by pharmacist)
            $table->string('dispensing_status')->default('pending'); // pending, issued, out_of_stock, partial
            $table->uuid('dispensed_by')->nullable();
            $table->timestamp('dispensed_at')->nullable();
            $table->uuid('batch_id')->nullable(); // Selected batch
            $table->integer('quantity_dispensed')->nullable();
            
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index('consultation_id');
            $table->index('product_id');
            $table->index('dispensing_status');
        });

        // 7. Consultation Audit Log
        Schema::create('consultation_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('consultation_id');
            $table->uuid('user_id');
            $table->string('user_role'); // doctor, cashier, pharmacist
            $table->string('action'); // started, submitted, payment_collected, medicines_issued
            $table->text('details')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
            
            $table->index('consultation_id');
            $table->index('user_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultation_audit_logs');
        Schema::dropIfExists('consultation_prescriptions');
        Schema::dropIfExists('consultation_diagnoses');
        Schema::dropIfExists('consultation_questions');
        Schema::dropIfExists('consultations');
        Schema::dropIfExists('diagnosis_master');
        Schema::dropIfExists('consultation_question_bank');
    }
};
