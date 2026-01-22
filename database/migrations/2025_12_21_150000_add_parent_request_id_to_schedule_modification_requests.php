<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add parent_request_id for cancellation requests
        Schema::table('schedule_modification_requests', function (Blueprint $table) {
            $table->uuid('parent_request_id')->nullable()->after('schedule_id');
        });

        // For SQLite, we need to recreate the table to modify the enum
        // Instead, we'll just allow 'cancel_block' as a valid value in the controller
        // The enum constraint is enforced at the application level
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedule_modification_requests', function (Blueprint $table) {
            $table->dropColumn('parent_request_id');
        });
    }
};
