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
        Schema::table('pharmacy_inventory', function (Blueprint $table) {
            $table->string('strength', 50)->nullable()->default('N/A')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pharmacy_inventory', function (Blueprint $table) {
            $table->string('strength', 50)->change();
        });
    }
};
