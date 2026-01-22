<?php

namespace App\Application\Services;

use Illuminate\Support\Facades\DB;

/**
 * Audit Service
 * Handles change tracking, deletion logs, and approval workflows
 */
class AuditService extends BaseService
{
    /**
     * Log entity change
     */
    public function logChange(
        int $userId,
        string $entityType,
        int $entityId,
        array $beforeData,
        array $afterData,
        string $action
    ): int {
        try {
            // Calculate changes
            $changes = $this->calculateChanges($beforeData, $afterData);

            $logId = DB::table('change_logs')->insertGetId([
                'user_id' => $userId,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'action' => $action,
                'before_data' => json_encode($beforeData),
                'after_data' => json_encode($afterData),
                'changes' => json_encode($changes),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            $this->log('info', 'Change logged', [
                'log_id' => $logId,
                'entity_type' => $entityType,
                'action' => $action,
            ]);

            return $logId;

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Log entity deletion
     */
    public function logDeletion(
        int $userId,
        string $entityType,
        int $entityId,
        array $deletedData,
        string $reason
    ): int {
        try {
            $logId = DB::table('deletion_logs')->insertGetId([
                'user_id' => $userId,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'deleted_data' => json_encode($deletedData),
                'reason' => $reason,
                'ip_address' => request()->ip(),
                'deleted_at' => now(),
                'created_at' => now(),
            ]);

            $this->log('warning', 'Deletion logged', [
                'log_id' => $logId,
                'entity_type' => $entityType,
                'reason' => $reason,
            ]);

            return $logId;

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Request second-layer approval
     */
    public function requestApproval(
        int $userId,
        string $action,
        string $entityType,
        array $data,
        string $reason
    ): int {
        try {
            $approvalId = DB::table('approval_requests')->insertGetId([
                'requested_by' => $userId,
                'action' => $action,
                'entity_type' => $entityType,
                'request_data' => json_encode($data),
                'reason' => $reason,
                'status' => 'pending',
                'requested_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->log('info', 'Approval requested', [
                'approval_id' => $approvalId,
                'action' => $action,
                'requested_by' => $userId,
            ]);

            return $approvalId;

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Approve change request
     */
    public function approveChange(int $approvalId, int $approverId, string $approvalNotes = null): array
    {
        try {
            $approval = DB::table('approval_requests')->where('id', $approvalId)->first();

            if (!$approval) {
                throw new \Exception('Approval request not found');
            }

            if ($approval->status !== 'pending') {
                throw new \Exception('Approval request is not pending');
            }

            // Update approval status
            DB::table('approval_requests')
                ->where('id', $approvalId)
                ->update([
                    'status' => 'approved',
                    'approved_by' => $approverId,
                    'approval_notes' => $approvalNotes,
                    'approved_at' => now(),
                    'updated_at' => now(),
                ]);

            // Execute the approved action
            $this->executeApprovedAction($approval);

            $this->log('info', 'Change approved', [
                'approval_id' => $approvalId,
                'approved_by' => $approverId,
            ]);

            return [
                'approval_id' => $approvalId,
                'status' => 'approved',
                'approved_by' => $approverId,
                'approved_at' => now(),
            ];

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Reject change request
     */
    public function rejectChange(int $approvalId, int $approverId, string $rejectionReason): array
    {
        try {
            $approval = DB::table('approval_requests')->where('id', $approvalId)->first();

            if (!$approval) {
                throw new \Exception('Approval request not found');
            }

            if ($approval->status !== 'pending') {
                throw new \Exception('Approval request is not pending');
            }

            DB::table('approval_requests')
                ->where('id', $approvalId)
                ->update([
                    'status' => 'rejected',
                    'approved_by' => $approverId,
                    'approval_notes' => $rejectionReason,
                    'approved_at' => now(),
                    'updated_at' => now(),
                ]);

            $this->log('info', 'Change rejected', [
                'approval_id' => $approvalId,
                'rejected_by' => $approverId,
                'reason' => $rejectionReason,
            ]);

            return [
                'approval_id' => $approvalId,
                'status' => 'rejected',
                'rejected_by' => $approverId,
                'reason' => $rejectionReason,
            ];

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Generate audit report
     */
    public function generateAuditReport(string $centerId, string $startDate, string $endDate): array
    {
        // Get all changes
        $changes = DB::table('change_logs')
            ->join('users', 'change_logs.user_id', '=', 'users.id')
            ->where('users.center_id', $centerId)
            ->whereBetween('change_logs.created_at', [$startDate, $endDate])
            ->select('change_logs.*', 'users.first_name', 'users.last_name', 'users.role')
            ->get();

        // Get all deletions
        $deletions = DB::table('deletion_logs')
            ->join('users', 'deletion_logs.user_id', '=', 'users.id')
            ->where('users.center_id', $centerId)
            ->whereBetween('deletion_logs.deleted_at', [$startDate, $endDate])
            ->select('deletion_logs.*', 'users.first_name', 'users.last_name', 'users.role')
            ->get();

        // Get approval requests
        $approvals = DB::table('approval_requests')
            ->join('users', 'approval_requests.requested_by', '=', 'users.id')
            ->where('users.center_id', $centerId)
            ->whereBetween('approval_requests.requested_at', [$startDate, $endDate])
            ->select('approval_requests.*', 'users.first_name', 'users.last_name')
            ->get();

        // Calculate statistics
        $statistics = [
            'total_changes' => $changes->count(),
            'total_deletions' => $deletions->count(),
            'total_approval_requests' => $approvals->count(),
            'approved_requests' => $approvals->where('status', 'approved')->count(),
            'rejected_requests' => $approvals->where('status', 'rejected')->count(),
            'pending_requests' => $approvals->where('status', 'pending')->count(),
            'changes_by_action' => $changes->groupBy('action')->map->count(),
            'changes_by_entity' => $changes->groupBy('entity_type')->map->count(),
        ];

        return [
            'center_id' => $centerId,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'statistics' => $statistics,
            'recent_changes' => $changes->take(50)->toArray(),
            'recent_deletions' => $deletions->take(20)->toArray(),
            'approval_requests' => $approvals->toArray(),
        ];
    }

    /**
     * Calculate changes between before and after data
     */
    private function calculateChanges(array $before, array $after): array
    {
        $changes = [];

        foreach ($after as $key => $value) {
            if (!isset($before[$key]) || $before[$key] !== $value) {
                $changes[$key] = [
                    'from' => $before[$key] ?? null,
                    'to' => $value,
                ];
            }
        }

        return $changes;
    }

    /**
     * Execute approved action
     */
    private function executeApprovedAction(object $approval): void
    {
        $data = json_decode($approval->request_data, true);

        // Execute based on action type
        switch ($approval->action) {
            case 'delete_patient':
                DB::table('patients')->where('id', $data['entity_id'])->delete();
                break;
            case 'update_medication_price':
                DB::table('medications')->where('id', $data['entity_id'])->update([
                    'price_per_unit' => $data['new_price'],
                ]);
                break;
            // Add more action types as needed
        }

        $this->log('info', 'Approved action executed', [
            'approval_id' => $approval->id,
            'action' => $approval->action,
        ]);
    }
}
