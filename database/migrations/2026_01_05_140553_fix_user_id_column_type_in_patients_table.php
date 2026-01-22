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
     * This fixes the id and user_id columns in patients table to accept UUID strings
     * since both Patient and User models use HasUuids trait.
     */
    public function up(): void
    {
        // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        DB::statement('PRAGMA foreign_keys = OFF');
        
        // Rename the old table
        DB::statement('ALTER TABLE patients RENAME TO patients_old');
        
        // Create new table with correct column types (UUID compatible)
        // Columns must be in exact order to match the original for data copy
        Schema::create('patients', function (Blueprint $table) {
            $table->string('id', 36)->primary(); // UUID string instead of integer
            $table->string('first_name', 50);
            $table->string('last_name', 50);
            $table->string('email', 100)->nullable();
            $table->string('phone_number', 20);
            $table->date('date_of_birth');
            $table->string('gender', 10);
            $table->text('address');
            $table->string('city', 50);
            $table->string('state', 50)->nullable();
            $table->string('zip_code', 10)->nullable();
            $table->string('unique_registration_number', 50);
            $table->integer('center_id');
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
            $table->string('user_id', 36)->nullable(); // UUID string instead of integer
            $table->string('phone', 20)->nullable();
            $table->string('name', 255)->nullable();
            $table->string('nic', 20)->nullable();
            $table->string('blood_type', 5)->nullable();
            $table->string('emergency_contact', 20)->nullable();
            $table->integer('registered_by')->nullable();
            $table->integer('age')->nullable();
        });
        
        // Copy all data from old table to new (columns must be in same order)
        DB::statement('INSERT INTO patients SELECT * FROM patients_old');
        
        // Drop old table
        DB::statement('DROP TABLE patients_old');
        
        DB::statement('PRAGMA foreign_keys = ON');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Not easily reversible for SQLite
    }
};
