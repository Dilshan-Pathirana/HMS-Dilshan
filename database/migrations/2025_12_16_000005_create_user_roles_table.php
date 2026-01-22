<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->string('role_name', 50)->unique(); // super_admin, branch_admin, doctor, nurse, etc.
            $table->string('display_name', 100);
            $table->text('description')->nullable();
            $table->json('permissions')->nullable(); // JSON array of permissions
            $table->integer('hierarchy_level')->default(0); // for role hierarchy (1=super admin, 2=branch admin, etc.)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default roles
        DB::table('user_roles')->insert([
            [
                'role_name' => 'super_admin',
                'display_name' => 'Super Administrator',
                'description' => 'Full system access across all branches',
                'permissions' => json_encode(['*']),
                'hierarchy_level' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'branch_admin',
                'display_name' => 'Branch Administrator',
                'description' => 'Full access to assigned branch operations',
                'permissions' => json_encode(['branch.*', 'users.manage', 'reports.view']),
                'hierarchy_level' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'doctor',
                'display_name' => 'Doctor',
                'description' => 'Medical professional providing consultations',
                'permissions' => json_encode(['appointments.*', 'patients.*', 'prescriptions.*', 'sessions.*']),
                'hierarchy_level' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'nurse',
                'display_name' => 'Nurse',
                'description' => 'Nursing staff assisting with patient care',
                'permissions' => json_encode(['patients.view', 'appointments.view', 'vital_signs.manage']),
                'hierarchy_level' => 4,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'pharmacist',
                'display_name' => 'Pharmacist',
                'description' => 'Manages pharmacy inventory and dispenses medications',
                'permissions' => json_encode(['pharmacy.*', 'prescriptions.view', 'inventory.*']),
                'hierarchy_level' => 4,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'cashier',
                'display_name' => 'Cashier',
                'description' => 'Handles billing and payments',
                'permissions' => json_encode(['billing.*', 'payments.*', 'invoices.*']),
                'hierarchy_level' => 5,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'receptionist',
                'display_name' => 'Receptionist',
                'description' => 'Manages appointments and patient registration',
                'permissions' => json_encode(['appointments.*', 'patients.create', 'patients.view']),
                'hierarchy_level' => 5,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'it_support',
                'display_name' => 'IT Support',
                'description' => 'Technical support and system maintenance',
                'permissions' => json_encode(['system.logs', 'system.settings', 'users.reset_password']),
                'hierarchy_level' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'center_aid',
                'display_name' => 'Center Aid',
                'description' => 'Support staff for general assistance',
                'permissions' => json_encode(['patients.view', 'appointments.view']),
                'hierarchy_level' => 6,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'auditor',
                'display_name' => 'Auditor',
                'description' => 'Reviews and audits system transactions',
                'permissions' => json_encode(['audit.*', 'reports.*', 'logs.view']),
                'hierarchy_level' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('user_roles');
    }
};
