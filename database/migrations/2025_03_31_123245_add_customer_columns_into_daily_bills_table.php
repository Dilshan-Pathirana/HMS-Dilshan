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
        Schema::table('daily_bills', function (Blueprint $table) {
            $table->uuid('customer_id')->nullable()->after('user_id');
            $table->string('customer_name')->nullable()->after('customer_id');
            $table->string('contact_number')->nullable()->after('customer_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_bills', function (Blueprint $table) {
            $table->dropColumn('customer_id');
            $table->dropColumn('customer_name');
            $table->dropColumn('contact_number');
        });
    }
};
