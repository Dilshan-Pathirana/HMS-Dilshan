<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('nurses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('branch_id')->constrained('branches')->onDelete('cascade');
            $table->date('date_of_birth');
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('nic_number')->unique()->nullable();
            $table->string('contact_number_mobile')->nullable();
            $table->string('contact_number_landline')->nullable();
            $table->string('email')->unique();
            $table->text('home_address')->nullable();
            $table->text('emergency_contact_info')->nullable();
            $table->string('photo')->nullable();
            $table->string('nic_photo')->nullable();
            $table->string('medical_registration_number')->unique()->nullable();
            $table->string('qualifications')->nullable();
            $table->integer('years_of_experience')->nullable();
            $table->text('previous_employment')->nullable();
            $table->date('license_validity_date')->nullable();
            $table->date('joining_date')->nullable();
            $table->string('employee_id')->unique();
            $table->enum('contract_type', ['full-time', 'part-time', 'consultant']);
            $table->string('contract_duration')->nullable();
            $table->date('probation_start_date')->nullable();
            $table->date('probation_end_date')->nullable();
            $table->decimal('compensation_package', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nurses');
    }
};
