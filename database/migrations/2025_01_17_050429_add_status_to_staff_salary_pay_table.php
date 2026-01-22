<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('staff_salary_pay', function (Blueprint $table) {
            $table->string('status')->default('unpaid')->after('month');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff_salary_pay', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
