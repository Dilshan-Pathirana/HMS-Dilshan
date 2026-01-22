<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds peer approval workflow for shift swap/interchange requests.
     * For interchange requests, the target colleague must approve first,
     * then it goes to branch admin for final approval.
     */
    public function up(): void
    {
        Schema::table('schedule_change_requests', function (Blueprint $table) {
            // Peer (colleague) approval status - for interchange requests
            $table->enum('peer_status', ['pending', 'approved', 'rejected'])->default('pending')->after('interchange_with');
            // When the peer (colleague) responded
            $table->timestamp('peer_responded_at')->nullable()->after('peer_status');
            // Reason if peer rejected
            $table->text('peer_rejection_reason')->nullable()->after('peer_responded_at');
            // The target colleague's shift date they're swapping
            $table->date('interchange_shift_date')->nullable()->after('peer_rejection_reason');
            // The target colleague's shift type they're swapping
            $table->string('interchange_shift_type')->nullable()->after('interchange_shift_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedule_change_requests', function (Blueprint $table) {
            $table->dropColumn([
                'peer_status',
                'peer_responded_at',
                'peer_rejection_reason',
                'interchange_shift_date',
                'interchange_shift_type'
            ]);
        });
    }
};
