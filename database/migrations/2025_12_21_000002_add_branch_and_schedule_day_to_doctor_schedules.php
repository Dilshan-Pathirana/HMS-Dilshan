<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            // Add branch_id if not exists
            if (!Schema::hasColumn('doctor_schedules', 'branch_id')) {
                $table->string('branch_id')->nullable()->after('doctor_id');
            }
            
            // Add schedule_day if not exists
            if (!Schema::hasColumn('doctor_schedules', 'schedule_day')) {
                $table->string('schedule_day')->nullable()->after('branch_id');
            }
            
            // Add max_patients if not exists (alias for max_sessions)
            if (!Schema::hasColumn('doctor_schedules', 'max_patients')) {
                $table->integer('max_patients')->default(20)->after('end_time');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('doctor_schedules', 'branch_id')) {
                $table->dropColumn('branch_id');
            }
            if (Schema::hasColumn('doctor_schedules', 'schedule_day')) {
                $table->dropColumn('schedule_day');
            }
            if (Schema::hasColumn('doctor_schedules', 'max_patients')) {
                $table->dropColumn('max_patients');
            }
        });
    }
};
