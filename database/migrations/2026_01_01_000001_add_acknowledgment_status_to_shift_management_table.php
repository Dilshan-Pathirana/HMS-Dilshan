<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds acknowledgment status fields to shift_management table
     */
    public function up(): void
    {
        Schema::table('shift_management', function (Blueprint $table) {
            if (!Schema::hasColumn('shift_management', 'status')) {
                $table->enum('status', ['pending', 'acknowledged', 'active', 'rejected', 'cancelled'])->default('pending')->after('notes');
            }
            if (!Schema::hasColumn('shift_management', 'acknowledged_at')) {
                $table->timestamp('acknowledged_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('shift_management', 'assigned_by')) {
                $table->uuid('assigned_by')->nullable()->after('acknowledged_at');
            }
            if (!Schema::hasColumn('shift_management', 'effective_from')) {
                $table->date('effective_from')->nullable()->after('assigned_by');
            }
            if (!Schema::hasColumn('shift_management', 'effective_to')) {
                $table->date('effective_to')->nullable()->after('effective_from');
            }
            if (!Schema::hasColumn('shift_management', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('effective_to');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shift_management', function (Blueprint $table) {
            $columns = [
                'status',
                'acknowledged_at',
                'assigned_by',
                'effective_from',
                'effective_to',
                'rejection_reason'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('shift_management', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
