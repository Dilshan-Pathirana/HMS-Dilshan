<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 50);
            $table->string('last_name', 50);
            $table->string('email', 100)->nullable();
            $table->string('phone_number', 20);
            $table->date('date_of_birth');
            $table->enum('gender', ['male', 'female', 'other']);
            $table->text('address');
            $table->string('city', 50);
            $table->string('state', 50)->nullable();
            $table->string('zip_code', 10)->nullable();
            $table->string('unique_registration_number', 50)->unique();
            $table->unsignedBigInteger('center_id');
            $table->string('emergency_contact_name', 100)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->string('emergency_contact_relation', 50)->nullable();
            $table->text('medical_history')->nullable(); // JSON format
            $table->text('allergies')->nullable(); // JSON format
            $table->string('blood_group', 5)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('center_id')->references('id')->on('medical_centers')->onDelete('cascade');
            
            $table->index('email');
            $table->index('phone_number');
            $table->index('unique_registration_number');
            $table->index('center_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
