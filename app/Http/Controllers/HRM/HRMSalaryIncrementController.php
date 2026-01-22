<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * STEP 14: Salary Increments Controller
 * Manages salary increment records and history
 */
class HRMSalaryIncrementController extends Controller
{
    /**
     * Manual token validation (bypasses Sanctum middleware)
     */
    private function validateToken(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }
        $accessToken = PersonalAccessToken::findToken($token);
        if (!$accessToken) {
            return null;
        }
        return $accessToken->tokenable;
    }

    private function isSuperAdmin($user): bool
    {
        return $user && in_array($user->role, ['super_admin', 'admin']);
    }

    private function isBranchAdmin($user): bool
    {
        return $user && in_array($user->role, ['branch_admin', 'manager']);
    }

    /**
     * Get increment history for an employee
     */
    public function getEmployeeIncrements(Request $request, $userId = null)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $targetUserId = $userId ?? $user->id;

        // Non-admins can only view their own
        if (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user) && $user->id !== $targetUserId) {
            return response()->json(['status' => 'error', 'message' => 'Access denied'], 403);
        }

        $increments = DB::table('salary_increments')
            ->where('user_id', $targetUserId)
            ->whereNull('deleted_at')
            ->orderBy('effective_date', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $increments
        ]);
    }

    /**
     * Get all pending increment requests (Super Admin / Branch Admin)
     */
    public function getPendingIncrements(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        if (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user)) {
            return response()->json(['status' => 'error', 'message' => 'Access denied'], 403);
        }

        $query = DB::table('salary_increments as si')
            ->join('users as u', 'si.user_id', '=', 'u.id')
            ->where('si.status', 'pending')
            ->whereNull('si.deleted_at')
            ->select(
                'si.*',
                'u.first_name',
                'u.last_name',
                'u.employee_id',
                'u.designation',
                'u.branch_id'
            );

        // Branch admin can only see their branch
        if ($this->isBranchAdmin($user) && !$this->isSuperAdmin($user)) {
            $query->where('u.branch_id', $user->branch_id);
        }

        $increments = $query->orderBy('si.effective_date', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $increments
        ]);
    }

    /**
     * Create salary increment record
     */
    public function createIncrement(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        if (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user)) {
            return response()->json(['status' => 'error', 'message' => 'Access denied'], 403);
        }

        $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
            'previous_salary' => 'required|numeric|min:0',
            'new_salary' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'increment_type' => 'required|in:annual,promotion,performance,cost_of_living,special,other',
            'reason' => 'nullable|string|max:255',
            'remarks' => 'nullable|string'
        ]);

        $incrementAmount = $request->new_salary - $request->previous_salary;
        $incrementPercentage = $request->previous_salary > 0 
            ? round(($incrementAmount / $request->previous_salary) * 100, 2) 
            : 0;

        $incrementId = Str::uuid()->toString();

        DB::table('salary_increments')->insert([
            'id' => $incrementId,
            'user_id' => $request->user_id,
            'previous_salary' => $request->previous_salary,
            'new_salary' => $request->new_salary,
            'increment_amount' => $incrementAmount,
            'increment_percentage' => $incrementPercentage,
            'effective_date' => $request->effective_date,
            'increment_type' => $request->increment_type,
            'reason' => $request->reason,
            'remarks' => $request->remarks,
            'status' => 'pending',
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Log the action
        $this->logAction($user->id, 'create', 'salary_increment', $incrementId, null, [
            'user_id' => $request->user_id,
            'increment_amount' => $incrementAmount,
            'increment_type' => $request->increment_type
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Salary increment created successfully',
            'data' => ['id' => $incrementId]
        ], 201);
    }

    /**
     * Approve salary increment
     */
    public function approveIncrement(Request $request, $incrementId)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        if (!$this->isSuperAdmin($user)) {
            return response()->json(['status' => 'error', 'message' => 'Only Super Admin can approve increments'], 403);
        }

        $increment = DB::table('salary_increments')
            ->where('id', $incrementId)
            ->whereNull('deleted_at')
            ->first();

        if (!$increment) {
            return response()->json(['status' => 'error', 'message' => 'Increment record not found'], 404);
        }

        if ($increment->status !== 'pending') {
            return response()->json(['status' => 'error', 'message' => 'Increment already processed'], 400);
        }

        DB::beginTransaction();
        try {
            // Update increment status
            DB::table('salary_increments')
                ->where('id', $incrementId)
                ->update([
                    'status' => 'approved',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                    'updated_at' => now()
                ]);

            // Update employee's salary in users table (if salary column exists)
            DB::table('users')
                ->where('id', $increment->user_id)
                ->update([
                    'basic_salary' => $increment->new_salary,
                    'updated_at' => now()
                ]);

            // Log the action
            $this->logAction($user->id, 'approve', 'salary_increment', $incrementId, 
                ['status' => 'pending'], 
                ['status' => 'approved']
            );

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Salary increment approved successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Failed to approve increment'], 500);
        }
    }

    /**
     * Reject salary increment
     */
    public function rejectIncrement(Request $request, $incrementId)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        if (!$this->isSuperAdmin($user)) {
            return response()->json(['status' => 'error', 'message' => 'Only Super Admin can reject increments'], 403);
        }

        $increment = DB::table('salary_increments')
            ->where('id', $incrementId)
            ->whereNull('deleted_at')
            ->first();

        if (!$increment) {
            return response()->json(['status' => 'error', 'message' => 'Increment record not found'], 404);
        }

        if ($increment->status !== 'pending') {
            return response()->json(['status' => 'error', 'message' => 'Increment already processed'], 400);
        }

        DB::table('salary_increments')
            ->where('id', $incrementId)
            ->update([
                'status' => 'rejected',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'remarks' => $increment->remarks . "\n\nRejection reason: " . ($request->reason ?? 'Not specified'),
                'updated_at' => now()
            ]);

        $this->logAction($user->id, 'reject', 'salary_increment', $incrementId, 
            ['status' => 'pending'], 
            ['status' => 'rejected']
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Salary increment rejected'
        ]);
    }

    /**
     * Get increment statistics
     */
    public function getIncrementStats(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        if (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user)) {
            return response()->json(['status' => 'error', 'message' => 'Access denied'], 403);
        }

        $currentYear = date('Y');

        $stats = [
            'pending' => DB::table('salary_increments')
                ->where('status', 'pending')
                ->whereNull('deleted_at')
                ->count(),
            'approved_this_year' => DB::table('salary_increments')
                ->where('status', 'approved')
                ->whereYear('approved_at', $currentYear)
                ->whereNull('deleted_at')
                ->count(),
            'total_increment_amount' => DB::table('salary_increments')
                ->where('status', 'approved')
                ->whereYear('approved_at', $currentYear)
                ->whereNull('deleted_at')
                ->sum('increment_amount'),
            'average_increment_percentage' => DB::table('salary_increments')
                ->where('status', 'approved')
                ->whereYear('approved_at', $currentYear)
                ->whereNull('deleted_at')
                ->avg('increment_percentage')
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }

    /**
     * Log HRM action for audit
     */
    private function logAction($userId, $actionType, $entityType, $entityId, $oldValues = null, $newValues = null)
    {
        try {
            DB::table('hrm_audit_logs')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $userId,
                'action_type' => $actionType,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'old_values' => $oldValues ? json_encode($oldValues) : null,
                'new_values' => $newValues ? json_encode($newValues) : null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } catch (\Exception $e) {
            // Silently fail logging
        }
    }
}
