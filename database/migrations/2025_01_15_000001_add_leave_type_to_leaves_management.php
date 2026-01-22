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
        Schema::table('leaves_management', function (Blueprint $table) {
            if (!Schema::hasColumn('leaves_management', 'leave_type_id')) {
                $table->unsignedBigInteger('leave_type_id')->nullable()->after('user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leaves_management', function (Blueprint $table) {
            if (Schema::hasColumn('leaves_management', 'leave_type_id')) {
                $table->dropColumn('leave_type_id');
            }
        });
    }
};
