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
        Schema::table('doctor_schedule_cancellations', function (Blueprint $table) {
            $table->uuid('schedule_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctor_schedule_cancellations', function (Blueprint $table) {
            $table->uuid('schedule_id')->nullable(false)->change();
        });
    }
};
