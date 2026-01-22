<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add fields to support patient rescheduling with limits:
     * - patient_reschedule_count: Normal reschedules initiated by patient (max 1)
     * - admin_granted_reschedule_count: Extra reschedules for appointments cancelled by Branch Admin (max 2)
     * - cancelled_by_admin_for_doctor: Flag when Branch Admin cancels on doctor's behalf
     * - cancelled_by_role: Track who cancelled (patient, branch_admin, receptionist, etc.)
     */
    public function up(): void
    {
        Schema::table('appointment_bookings', function (Blueprint $table) {
            // Patient-initiated reschedule count (max 1 normally)
            $table->integer('patient_reschedule_count')->default(0)->after('reschedule_count');
            
            // Admin-granted reschedule count for appointments cancelled by admin (max 2)
            $table->integer('admin_granted_reschedule_count')->default(0)->after('patient_reschedule_count');
            
            // Flag: Was this appointment cancelled by Branch Admin on doctor's request?
            $table->boolean('cancelled_by_admin_for_doctor')->default(false)->after('admin_granted_reschedule_count');
            
            // Role of the person who cancelled (patient, branch_admin, receptionist, super_admin)
            $table->string('cancelled_by_role')->nullable()->after('cancelled_by');
            
            // Index for efficient queries on cancelled appointments by role
            $table->index(['cancelled_by_role', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointment_bookings', function (Blueprint $table) {
            $table->dropIndex(['cancelled_by_role', 'status']);
            $table->dropColumn([
                'patient_reschedule_count',
                'admin_granted_reschedule_count',
                'cancelled_by_admin_for_doctor',
                'cancelled_by_role',
            ]);
        });
    }
};
