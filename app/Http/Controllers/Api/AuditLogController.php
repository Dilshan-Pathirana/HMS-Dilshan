<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\POSAuditService;
use App\Models\ChangeLog;
use App\Traits\EnforcesBranchIsolation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLogController extends Controller
{
    use EnforcesBranchIsolation;
    /**
     * Get audit logs for the current branch (Branch Admin)
     */
    public function getBranchAuditLogs(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $filters = [
                'branch_id' => $branchId,
                'module' => $request->get('module'),
                'action' => $request->get('action'),
                'user_id' => $request->get('user_id'),
                'entity_type' => $request->get('entity_type'),
                'severity' => $request->get('severity'),
                'transaction_id' => $request->get('transaction_id'),
                'start_date' => $request->get('start_date'),
                'end_date' => $request->get('end_date'),
                'search' => $request->get('search'),
            ];

            $perPage = $request->get('per_page', 50);
            $logs = POSAuditService::getLogs($filters, $perPage);

            return response()->json([
                'status' => 200,
                'data' => $logs->items(),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch audit logs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all audit logs (Super Admin)
     */
    public function getAllAuditLogs(Request $request)
    {
        try {
            $filters = [
                'branch_id' => $request->get('branch_id'),
                'module' => $request->get('module'),
                'action' => $request->get('action'),
                'user_id' => $request->get('user_id'),
                'entity_type' => $request->get('entity_type'),
                'severity' => $request->get('severity'),
                'transaction_id' => $request->get('transaction_id'),
                'start_date' => $request->get('start_date'),
                'end_date' => $request->get('end_date'),
                'search' => $request->get('search'),
            ];

            $perPage = $request->get('per_page', 50);
            $logs = POSAuditService::getLogs($filters, $perPage);

            return response()->json([
                'status' => 200,
                'data' => $logs->items(),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch audit logs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get transaction history (all audit logs for a specific transaction)
     */
    public function getTransactionHistory(Request $request, $transactionId)
    {
        try {
            $logs = POSAuditService::getTransactionHistory($transactionId);

            return response()->json([
                'status' => 200,
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch transaction history',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user activity logs
     */
    public function getUserActivity(Request $request, $userId)
    {
        try {
            $user = Auth::user();
            
            // Branch admins can only see their own branch's users
            if ($user->role !== 'super_admin') {
                $targetUser = \App\Models\AllUsers\User::find($userId);
                if (!$targetUser || $targetUser->branch_id !== $user->branch_id) {
                    return response()->json([
                        'status' => 403,
                        'message' => 'Unauthorized to view this user\'s activity',
                    ], 403);
                }
            }

            $limit = $request->get('limit', 100);
            $logs = POSAuditService::getUserActivity($userId, $limit);

            return response()->json([
                'status' => 200,
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch user activity',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get audit log statistics
     */
    public function getAuditStats(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->role === 'super_admin' ? $request->get('branch_id') : $user->branch_id;
            
            $query = ChangeLog::query();
            
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $today = now()->startOfDay();
            $thisWeek = now()->startOfWeek();
            $thisMonth = now()->startOfMonth();

            $stats = [
                'today' => (clone $query)->where('created_at', '>=', $today)->count(),
                'this_week' => (clone $query)->where('created_at', '>=', $thisWeek)->count(),
                'this_month' => (clone $query)->where('created_at', '>=', $thisMonth)->count(),
                'by_module' => (clone $query)->where('created_at', '>=', $thisMonth)
                    ->whereNotNull('module')
                    ->groupBy('module')
                    ->selectRaw('module, count(*) as count')
                    ->pluck('count', 'module'),
                'by_severity' => (clone $query)->where('created_at', '>=', $thisMonth)
                    ->whereNotNull('severity')
                    ->groupBy('severity')
                    ->selectRaw('severity, count(*) as count')
                    ->pluck('count', 'severity'),
                'recent_critical' => (clone $query)->where('severity', 'critical')
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->with('user')
                    ->get(),
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch audit statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
