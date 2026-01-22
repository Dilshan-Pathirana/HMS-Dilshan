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
        Schema::table('epf_etf_config', function (Blueprint $table) {
            if (!Schema::hasColumn('epf_etf_config', 'branch_id')) {
                $table->uuid('branch_id')->nullable()->after('id');
                $table->index('branch_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('epf_etf_config', function (Blueprint $table) {
            if (Schema::hasColumn('epf_etf_config', 'branch_id')) {
                $table->dropIndex(['branch_id']);
                $table->dropColumn('branch_id');
            }
        });
    }
};
