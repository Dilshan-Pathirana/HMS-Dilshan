<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Make several columns nullable in patients table to support new patient registration
     * via the signup flow which uses different column names.
     */
    public function up(): void
    {
        // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        // Disable foreign key constraints
        Schema::disableForeignKeyConstraints();

        // Rename the old table
        // Rename the old table
        Schema::rename('patients', 'patients_old');

        // Create new table with the corrected nullability
        Schema::create('patients', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('first_name', 50);
            $table->string('last_name', 50);
            $table->string('email', 100)->nullable();
            $table->string('phone_number', 20)->nullable(); // Made nullable
            $table->date('date_of_birth')->nullable(); // Made nullable
            $table->string('gender', 10)->nullable(); // Made nullable
            $table->text('address')->nullable(); // Made nullable
            $table->string('city', 50)->nullable(); // Made nullable
            $table->string('state', 50)->nullable();
            $table->string('zip_code', 10)->nullable();
            $table->string('unique_registration_number', 50)->nullable(); // Made nullable
            $table->integer('center_id')->nullable(); // Made nullable
            $table->string('emergency_contact_name', 100)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->string('emergency_contact_relation', 50)->nullable();
            $table->text('medical_history')->nullable();
            $table->text('allergies')->nullable();
            $table->string('blood_group', 5)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->string('branch_id', 36)->nullable();
            $table->string('patient_id', 50)->nullable();
            $table->string('user_id', 36)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('name', 255)->nullable();
            $table->string('nic', 20)->nullable();
            if (!Schema::hasColumn('patients', 'blood_type')) {
                $table->string('blood_type', 5)->nullable();
            }
            $table->string('emergency_contact', 20)->nullable();
            $table->integer('registered_by')->nullable();
            $table->integer('age')->nullable();
        });

        // Copy all data from old table to new
        DB::statement('INSERT INTO patients SELECT * FROM patients_old');

        // Drop old table
        Schema::drop('patients_old');

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Not easily reversible for SQLite
    }
};
