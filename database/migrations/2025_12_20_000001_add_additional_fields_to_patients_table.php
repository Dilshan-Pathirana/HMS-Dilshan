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
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'city')) {
                $table->string('city')->nullable()->after('address');
            }
            if (!Schema::hasColumn('patients', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('city');
            }
            if (!Schema::hasColumn('patients', 'gender')) {
                $table->string('gender', 20)->nullable()->after('date_of_birth');
            }
            if (!Schema::hasColumn('patients', 'blood_type')) {
                $table->string('blood_type', 10)->nullable()->after('gender');
            }
            if (!Schema::hasColumn('patients', 'emergency_contact_name')) {
                $table->string('emergency_contact_name')->nullable()->after('blood_type');
            }
            if (!Schema::hasColumn('patients', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone', 20)->nullable()->after('emergency_contact_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'city',
                'date_of_birth',
                'gender',
                'blood_type',
                'emergency_contact_name',
                'emergency_contact_phone',
            ]);
        });
    }
};
