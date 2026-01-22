<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_handovers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('from_nurse_id'); // Outgoing nurse
            $table->unsignedBigInteger('to_nurse_id')->nullable(); // Incoming nurse (can be null initially)
            $table->unsignedBigInteger('branch_id');
            $table->string('ward')->nullable();
            
            $table->date('handover_date');
            $table->enum('from_shift', ['morning', 'afternoon', 'night']);
            $table->enum('to_shift', ['morning', 'afternoon', 'night']);
            
            // Handover content
            $table->text('patient_updates')->nullable(); // JSON: [{patient_id, name, condition, notes}]
            $table->text('pending_tasks')->nullable(); // JSON: [{task, priority, patient}]
            $table->text('critical_alerts')->nullable(); // JSON: [{patient, alert, severity}]
            $table->text('general_notes')->nullable();
            $table->text('special_observations')->nullable();
            
            // Acknowledgment
            $table->boolean('is_acknowledged')->default(false);
            $table->timestamp('acknowledged_at')->nullable();
            $table->text('acknowledgment_notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('from_nurse_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('to_nurse_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('branch_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index(['from_nurse_id', 'handover_date']);
            $table->index(['to_nurse_id', 'handover_date']);
            $table->index(['branch_id', 'ward', 'handover_date']);
            $table->index('is_acknowledged');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_handovers');
    }
};
