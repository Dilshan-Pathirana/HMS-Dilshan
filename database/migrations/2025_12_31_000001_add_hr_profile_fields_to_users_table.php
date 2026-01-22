<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * STEP 3: HR Profile Extension
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // HR Profile Fields
            $table->string('employee_id')->nullable()->after('id');
            $table->enum('employment_type', ['permanent', 'contract', 'probation', 'intern', 'part_time'])->default('permanent')->after('user_type');
            $table->date('contract_end_date')->nullable()->after('joining_date');
            $table->date('confirmation_date')->nullable()->after('contract_end_date');
            
            // EPF/ETF Applicability
            $table->boolean('epf_applicable')->default(true)->after('basic_salary');
            $table->string('epf_number')->nullable()->after('epf_applicable');
            
            // Emergency Contact
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relationship')->nullable();
            
            // Qualifications
            $table->text('qualifications')->nullable();
            $table->text('certifications')->nullable();
            
            // Department/Designation
            $table->string('department')->nullable();
            $table->string('designation')->nullable();
            
            // Work schedule
            $table->integer('weekly_hours')->default(45);
            $table->boolean('shift_eligible')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'employee_id',
                'employment_type',
                'contract_end_date',
                'confirmation_date',
                'epf_applicable',
                'epf_number',
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relationship',
                'qualifications',
                'certifications',
                'department',
                'designation',
                'weekly_hours',
                'shift_eligible'
            ]);
        });
    }
};
