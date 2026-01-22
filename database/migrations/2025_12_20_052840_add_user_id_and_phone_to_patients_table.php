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
            $table->uuid('user_id')->nullable()->after('id');
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('name', 255)->nullable()->after('last_name');
            $table->string('nic', 20)->nullable()->after('phone');
            if (!Schema::hasColumn('patients', 'blood_type')) {
                $table->string('blood_type', 5)->nullable()->after('blood_group');
            }
            $table->string('emergency_contact', 20)->nullable()->after('emergency_contact_phone');
            $table->unsignedBigInteger('registered_by')->nullable()->after('is_active');
            $table->integer('age')->nullable()->after('date_of_birth');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'phone', 'name', 'nic', 'blood_type', 'emergency_contact', 'registered_by', 'age']);
        });
    }
};
