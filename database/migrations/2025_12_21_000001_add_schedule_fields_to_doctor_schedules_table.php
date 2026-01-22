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
            if (!Schema::hasColumn('doctor_schedules', 'end_time')) {
                $table->time('end_time')->nullable()->after('start_time');
            }
            if (!Schema::hasColumn('doctor_schedules', 'time_per_patient')) {
                $table->integer('time_per_patient')->default(15)->after('max_sessions');
            }
            if (!Schema::hasColumn('doctor_schedules', 'status')) {
                $table->string('status')->default('active')->after('time_per_patient');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('doctor_schedules', 'end_time')) {
                $table->dropColumn('end_time');
            }
            if (Schema::hasColumn('doctor_schedules', 'time_per_patient')) {
                $table->dropColumn('time_per_patient');
            }
            if (Schema::hasColumn('doctor_schedules', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
