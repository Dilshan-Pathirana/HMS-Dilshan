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
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->foreignUuid('branch_id')->nullable()->change()->constrained('branches')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->foreignUuid('branch_id')->nullable(false)->change()->constrained('branches')->onDelete('cascade');
        });
    }
};
