<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add branch_id and transaction_id to change_logs for POS audit trail
     */
    public function up(): void
    {
        Schema::table('change_logs', function (Blueprint $table) {
            // Add branch_id for branch-specific audit tracking
            $table->unsignedBigInteger('branch_id')->nullable()->after('user_id');
            
            // Add transaction_id for linking to billing transactions
            $table->unsignedBigInteger('transaction_id')->nullable()->after('entity_id');
            
            // Add module field for categorizing actions
            $table->string('module', 50)->nullable()->after('action');
            
            // Add severity for flagging important actions
            $table->enum('severity', ['info', 'warning', 'critical'])->default('info')->after('module');
            
            // Indexes for efficient queries
            $table->index('branch_id');
            $table->index('transaction_id');
            $table->index('module');
            $table->index('severity');
            
            // Foreign keys
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('change_logs', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['transaction_id']);
            $table->dropIndex(['module']);
            $table->dropIndex(['severity']);
            
            $table->dropColumn(['branch_id', 'transaction_id', 'module', 'severity']);
        });
    }
};
