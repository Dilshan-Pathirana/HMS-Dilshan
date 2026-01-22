<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;
use App\Models\HRM\HRMAuditLog;

/**
 * STEP 20: HRM Audit Log Controller
 * Provides audit trail for all HR activities
 */
class HRMAuditLogController extends Controller
{
    /**
     * Role ID to name mapping
     */
    private const ROLE_MAP = [
        1 => 'super_admin',
        2 => 'branch_admin',
        3 => 'doctor',
        4 => 'pharmacist',
        5 => 'nurse',
        6 => 'patient',
        7 => 'cashier',
        8 => 'supplier',
        9 => 'it_support',
        10 => 'center_aid',
        11 => 'auditor',
    ];

    private function validateToken(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        $accessToken = PersonalAccessToken::findToken($token);
        return $accessToken ? $accessToken->tokenable : null;
    }

    private function isSuperAdmin($user): bool
    {
        return $user && in_array($user->role, ['super_admin', 'admin']);
    }

    private function isBranchAdmin($user): bool
    {
        return $user && in_array($user->role, ['branch_admin', 'manager']);
    }

    private function mapRoleIdToName($roleId): string
    {
        return self::ROLE_MAP[$roleId] ?? 'unknown';
    }

    /**
     * Get all audit logs with filtering and pagination
     */
    public function index(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        // Check if table exists
        $tableExists = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='hrm_audit_logs'");
        if (empty($tableExists)) {
            return response()->json([
                'status' => 'success',
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 20,
                    'total' => 0
                ]
            ]);
        }

        $perPage = $request->input('per_page', 20);
        $page = $request->input('page', 1);
        $search = $request->input('search');
        $actionType = $request->input('action_type');
        $entityType = $request->input('entity_type');
        $branchId = $request->input('branch_id');
        $userId = $request->input('user_id');
        $targetUserId = $request->input('target_user_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Branch admin can only see their branch's logs
        if ($this->isBranchAdmin($user) && !$this->isSuperAdmin($user)) {
            $branchId = $user->branch_id;
        }

        $query = DB::table('hrm_audit_logs as l')
            ->leftJoin('users as u', 'l.user_id', '=', 'u.id')
            ->leftJoin('users as tu', 'l.target_user_id', '=', 'tu.id')
            ->leftJoin('branches as b', 'l.branch_id', '=', 'b.id')
            ->select([
                'l.id',
                'l.user_id',
                'u.name as user_name',
                'u.email as user_email',
                'u.role_as as user_role',
                'l.target_user_id',
                'tu.name as target_user_name',
                'tu.email as target_user_email',
                'l.branch_id',
                'b.center_name as branch_name',
                'l.action_type',
                'l.entity_type',
                'l.entity_id',
                'l.old_values',
                'l.new_values',
                'l.description',
                'l.ip_address',
                'l.user_agent',
                'l.created_at',
            ]);

        // Filters
        if ($branchId) {
            $query->where('l.branch_id', $branchId);
        }

        if ($actionType) {
            $query->where('l.action_type', $actionType);
        }

        if ($entityType) {
            $query->where('l.entity_type', $entityType);
        }

        if ($userId) {
            $query->where('l.user_id', $userId);
        }

        if ($targetUserId) {
            $query->where('l.target_user_id', $targetUserId);
        }

        if ($startDate) {
            $query->whereDate('l.created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('l.created_at', '<=', $endDate);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('u.name', 'like', "%{$search}%")
                  ->orWhere('tu.name', 'like', "%{$search}%")
                  ->orWhere('l.description', 'like', "%{$search}%")
                  ->orWhere('l.action_type', 'like', "%{$search}%")
                  ->orWhere('l.entity_type', 'like', "%{$search}%");
            });
        }

        // Get total count
        $total = $query->count();

        // Apply pagination
        $logs = $query->orderBy('l.created_at', 'desc')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(function ($log) {
                $log->old_values = $log->old_values ? json_decode($log->old_values, true) : null;
                $log->new_values = $log->new_values ? json_decode($log->new_values, true) : null;
                // Convert role_as ID to role name
                $log->user_role = $this->mapRoleIdToName($log->user_role);
                return $log;
            });

        return response()->json([
            'status' => 'success',
            'data' => $logs,
            'meta' => [
                'current_page' => (int)$page,
                'last_page' => ceil($total / $perPage),
                'per_page' => (int)$perPage,
                'total' => $total
            ]
        ]);
    }

    /**
     * Get single audit log details
     */
    public function show(Request $request, string $id)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $log = DB::table('hrm_audit_logs as l')
            ->leftJoin('users as u', 'l.user_id', '=', 'u.id')
            ->leftJoin('users as tu', 'l.target_user_id', '=', 'tu.id')
            ->leftJoin('branches as b', 'l.branch_id', '=', 'b.id')
            ->select([
                'l.*',
                'u.name as user_name',
                'u.email as user_email',
                'u.role_as as user_role',
                'tu.name as target_user_name',
                'tu.email as target_user_email',
                'tu.role_as as target_user_role',
                'b.center_name as branch_name',
            ])
            ->where('l.id', $id)
            ->first();

        if (!$log) {
            return response()->json(['status' => 'error', 'message' => 'Audit log not found'], 404);
        }

        // Branch admin can only view their branch's logs
        if ($this->isBranchAdmin($user) && !$this->isSuperAdmin($user)) {
            if ($log->branch_id !== $user->branch_id) {
                return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
            }
        }

        $log->old_values = $log->old_values ? json_decode($log->old_values, true) : null;
        $log->new_values = $log->new_values ? json_decode($log->new_values, true) : null;
        // Convert role_as ID to role name
        $log->user_role = $this->mapRoleIdToName($log->user_role);
        $log->target_user_role = $log->target_user_role ? $this->mapRoleIdToName($log->target_user_role) : null;

        return response()->json([
            'status' => 'success',
            'data' => $log
        ]);
    }

    /**
     * Get audit log statistics
     */
    public function getStats(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        // Check if table exists
        $tableExists = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='hrm_audit_logs'");
        if (empty($tableExists)) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_logs' => 0,
                    'today_count' => 0,
                    'this_week_count' => 0,
                    'this_month_count' => 0,
                    'by_action_type' => [],
                    'by_entity_type' => [],
                    'by_branch' => [],
                    'recent_activity' => []
                ]
            ]);
        }

        $branchId = $this->isBranchAdmin($user) && !$this->isSuperAdmin($user) 
            ? $user->branch_id 
            : $request->input('branch_id');

        $baseQuery = DB::table('hrm_audit_logs');
        if ($branchId) {
            $baseQuery->where('branch_id', $branchId);
        }

        $today = date('Y-m-d');
        $weekStart = date('Y-m-d', strtotime('-7 days'));
        $monthStart = date('Y-m-01');

        // Counts
        $totalLogs = (clone $baseQuery)->count();
        $todayCount = (clone $baseQuery)->whereDate('created_at', $today)->count();
        $weekCount = (clone $baseQuery)->whereDate('created_at', '>=', $weekStart)->count();
        $monthCount = (clone $baseQuery)->whereDate('created_at', '>=', $monthStart)->count();

        // By action type
        $byActionType = (clone $baseQuery)
            ->select('action_type', DB::raw('count(*) as count'))
            ->groupBy('action_type')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // By entity type
        $byEntityType = (clone $baseQuery)
            ->select('entity_type', DB::raw('count(*) as count'))
            ->groupBy('entity_type')
            ->orderByDesc('count')
            ->get();

        // By branch (super admin only)
        $byBranch = [];
        if ($this->isSuperAdmin($user)) {
            $byBranch = DB::table('hrm_audit_logs as l')
                ->leftJoin('branches as b', 'l.branch_id', '=', 'b.id')
                ->select('b.center_name as branch_name', DB::raw('count(*) as count'))
                ->whereNotNull('l.branch_id')
                ->groupBy('b.id', 'b.center_name')
                ->orderByDesc('count')
                ->limit(10)
                ->get();
        }

        // Recent activity (last 10)
        $recentActivity = DB::table('hrm_audit_logs as l')
            ->leftJoin('users as u', 'l.user_id', '=', 'u.id')
            ->select(['l.id', 'l.action_type', 'l.entity_type', 'l.description', 'u.name as user_name', 'l.created_at'])
            ->when($branchId, function ($q) use ($branchId) {
                return $q->where('l.branch_id', $branchId);
            })
            ->orderByDesc('l.created_at')
            ->limit(10)
            ->get();

        // Top users by activity
        $topUsers = DB::table('hrm_audit_logs as l')
            ->join('users as u', 'l.user_id', '=', 'u.id')
            ->select('u.name', 'u.email', DB::raw('count(*) as count'))
            ->when($branchId, function ($q) use ($branchId) {
                return $q->where('l.branch_id', $branchId);
            })
            ->groupBy('u.id', 'u.name', 'u.email')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_logs' => $totalLogs,
                'today_count' => $todayCount,
                'this_week_count' => $weekCount,
                'this_month_count' => $monthCount,
                'by_action_type' => $byActionType,
                'by_entity_type' => $byEntityType,
                'by_branch' => $byBranch,
                'recent_activity' => $recentActivity,
                'top_users' => $topUsers
            ]
        ]);
    }

    /**
     * Get filter options (action types, entity types, users, branches)
     */
    public function getFilterOptions(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $branchId = $this->isBranchAdmin($user) && !$this->isSuperAdmin($user) 
            ? $user->branch_id 
            : null;

        // Get distinct action types used
        $actionTypes = DB::table('hrm_audit_logs')
            ->select('action_type')
            ->distinct()
            ->when($branchId, function ($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })
            ->pluck('action_type');

        // Get distinct entity types used
        $entityTypes = DB::table('hrm_audit_logs')
            ->select('entity_type')
            ->distinct()
            ->when($branchId, function ($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })
            ->pluck('entity_type');

        // Get users who have performed actions
        $users = DB::table('hrm_audit_logs as l')
            ->join('users as u', 'l.user_id', '=', 'u.id')
            ->select('u.id', 'u.name', 'u.email')
            ->distinct()
            ->when($branchId, function ($q) use ($branchId) {
                return $q->where('l.branch_id', $branchId);
            })
            ->get();

        // Get branches (super admin only)
        $branches = [];
        if ($this->isSuperAdmin($user)) {
            $branches = DB::table('branches')
                ->select('id', 'center_name')
                ->where('is_active', 1)
                ->orderBy('center_name')
                ->get();
        }

        // Get predefined action types and entity types for reference
        $allActionTypes = HRMAuditLog::getActionTypes();
        $allEntityTypes = HRMAuditLog::getEntityTypes();

        return response()->json([
            'status' => 'success',
            'data' => [
                'action_types' => $actionTypes,
                'entity_types' => $entityTypes,
                'users' => $users,
                'branches' => $branches,
                'action_type_labels' => $allActionTypes,
                'entity_type_labels' => $allEntityTypes
            ]
        ]);
    }

    /**
     * Export audit logs as CSV
     */
    public function export(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $actionType = $request->input('action_type');
        $entityType = $request->input('entity_type');
        $branchId = $request->input('branch_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Branch admin restriction
        if ($this->isBranchAdmin($user) && !$this->isSuperAdmin($user)) {
            $branchId = $user->branch_id;
        }

        $query = DB::table('hrm_audit_logs as l')
            ->leftJoin('users as u', 'l.user_id', '=', 'u.id')
            ->leftJoin('users as tu', 'l.target_user_id', '=', 'tu.id')
            ->leftJoin('branches as b', 'l.branch_id', '=', 'b.id')
            ->select([
                'l.id',
                'u.name as performed_by',
                'u.email as performer_email',
                'tu.name as affected_employee',
                'b.center_name as branch',
                'l.action_type',
                'l.entity_type',
                'l.description',
                'l.ip_address',
                'l.created_at',
            ]);

        if ($branchId) $query->where('l.branch_id', $branchId);
        if ($actionType) $query->where('l.action_type', $actionType);
        if ($entityType) $query->where('l.entity_type', $entityType);
        if ($startDate) $query->whereDate('l.created_at', '>=', $startDate);
        if ($endDate) $query->whereDate('l.created_at', '<=', $endDate);

        $logs = $query->orderBy('l.created_at', 'desc')->limit(5000)->get();

        // Log this export action
        HRMAuditLog::logAction(
            $user->id,
            'data_export',
            'audit_log',
            null,
            null,
            $user->branch_id,
            null,
            ['exported_count' => count($logs), 'filters' => $request->all()],
            'Exported audit logs',
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    }

    /**
     * Get activity timeline for a specific user
     */
    public function getUserTimeline(Request $request, string $userId)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $perPage = $request->input('per_page', 20);
        $page = $request->input('page', 1);

        $query = DB::table('hrm_audit_logs as l')
            ->leftJoin('users as u', 'l.user_id', '=', 'u.id')
            ->leftJoin('branches as b', 'l.branch_id', '=', 'b.id')
            ->select([
                'l.id',
                'u.name as performer_name',
                'l.action_type',
                'l.entity_type',
                'l.description',
                'l.old_values',
                'l.new_values',
                'b.center_name as branch_name',
                'l.created_at',
            ])
            ->where(function ($q) use ($userId) {
                $q->where('l.user_id', $userId)
                  ->orWhere('l.target_user_id', $userId);
            })
            ->orderBy('l.created_at', 'desc');

        // Branch admin restriction
        if ($this->isBranchAdmin($user) && !$this->isSuperAdmin($user)) {
            $query->where('l.branch_id', $user->branch_id);
        }

        $total = $query->count();
        
        $logs = $query->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(function ($log) {
                $log->old_values = $log->old_values ? json_decode($log->old_values, true) : null;
                $log->new_values = $log->new_values ? json_decode($log->new_values, true) : null;
                return $log;
            });

        return response()->json([
            'status' => 'success',
            'data' => $logs,
            'meta' => [
                'current_page' => (int)$page,
                'last_page' => ceil($total / $perPage),
                'per_page' => (int)$perPage,
                'total' => $total
            ]
        ]);
    }
}
