<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dispensing_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('prescription_id');
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('medication_id');
            $table->integer('quantity_dispensed');
            $table->uuid('dispensed_by'); // pharmacist user_id
            $table->timestamp('dispense_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('prescription_id')->references('id')->on('prescriptions')->onDelete('cascade');
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('medication_id')->references('id')->on('medications')->onDelete('restrict');
            $table->foreign('dispensed_by')->references('id')->on('users')->onDelete('restrict');
            
            $table->index('prescription_id');
            $table->index('dispense_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispensing_records');
    }
};
