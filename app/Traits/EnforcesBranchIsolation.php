<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Branch Isolation Trait
 * 
 * Provides consistent branch isolation methods for controllers.
 * Ensures no cross-branch data leaks.
 */
trait EnforcesBranchIsolation
{
    /**
     * Get the effective branch ID for the current user/request
     * 
     * @param \Illuminate\Http\Request|null $request
     * @return int|null
     */
    protected function getEffectiveBranchId($request = null): ?int
    {
        $user = Auth::user();
        
        if (!$user) {
            return null;
        }

        // Super admins can specify a branch
        if ($this->isSuperAdmin($user)) {
            if ($request && $request->has('branch_id')) {
                return (int) $request->input('branch_id');
            }
            // Fall back to user's branch if any
            return $user->branch_id;
        }

        // All other users use their assigned branch
        return $user->branch_id;
    }

    /**
     * Validate that user can access the specified branch
     * 
     * @param int $branchId
     * @param mixed|null $user
     * @return bool
     */
    protected function canAccessBranch(int $branchId, $user = null): bool
    {
        $user = $user ?? Auth::user();
        
        if (!$user) {
            return false;
        }

        // Super admins can access any branch
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Others can only access their own branch
        return $user->branch_id === $branchId;
    }

    /**
     * Enforce branch isolation - returns error response if violation
     * 
     * @param int $branchId The branch being accessed
     * @param mixed|null $user
     * @return \Illuminate\Http\JsonResponse|null Returns null if access allowed, error response if denied
     */
    protected function enforceBranchIsolation(int $branchId, $user = null): ?\Illuminate\Http\JsonResponse
    {
        if (!$this->canAccessBranch($branchId, $user)) {
            $actualUser = $user ?? Auth::user();
            
            Log::warning('Branch isolation violation', [
                'user_id' => $actualUser?->id,
                'user_branch' => $actualUser?->branch_id,
                'attempted_branch' => $branchId,
                'ip' => request()->ip(),
            ]);

            return response()->json([
                'status' => 403,
                'message' => 'Access denied. You can only access data from your assigned branch.',
            ], 403);
        }

        return null;
    }

    /**
     * Check if user is a super admin
     * 
     * @param mixed $user
     * @return bool
     */
    protected function isSuperAdmin($user): bool
    {
        if (!$user) {
            return false;
        }

        // Check role_as
        if ($user->role_as === 1) {
            return true;
        }

        // Check role attribute
        if (isset($user->role) && strtolower($user->role) === 'super_admin') {
            return true;
        }

        // Check token ability
        if (method_exists($user, 'tokenCan') && $user->tokenCan('server:super-admin')) {
            return true;
        }

        return false;
    }

    /**
     * Check if user is a branch admin
     * 
     * @param mixed $user
     * @return bool
     */
    protected function isBranchAdmin($user): bool
    {
        if (!$user) {
            return false;
        }

        // Check role_as
        if ($user->role_as === 2) {
            return true;
        }

        // Check role attribute
        if (isset($user->role) && strtolower($user->role) === 'branch_admin') {
            return true;
        }

        // Check token ability
        if (method_exists($user, 'tokenCan') && $user->tokenCan('server:admin')) {
            return true;
        }

        return false;
    }

    /**
     * Apply branch filter to a query builder
     * Automatically filters by user's branch unless super admin
     * 
     * @param \Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Query\Builder $query
     * @param string $branchColumn
     * @param int|null $explicitBranchId Optional explicit branch ID (for super admins)
     * @return \Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Query\Builder
     */
    protected function applyBranchFilter($query, string $branchColumn = 'branch_id', ?int $explicitBranchId = null)
    {
        $user = Auth::user();

        if (!$user) {
            // No user, filter out everything
            return $query->whereRaw('1 = 0');
        }

        // Super admins with explicit branch filter
        if ($this->isSuperAdmin($user) && $explicitBranchId) {
            return $query->where($branchColumn, $explicitBranchId);
        }

        // Super admins without filter can see all
        if ($this->isSuperAdmin($user)) {
            return $query;
        }

        // All others are filtered to their branch
        if ($user->branch_id) {
            return $query->where($branchColumn, $user->branch_id);
        }

        // No branch assigned, show nothing
        return $query->whereRaw('1 = 0');
    }

    /**
     * Get the current user's role for audit logging
     * 
     * @return string
     */
    protected function getCurrentUserRole(): string
    {
        $user = Auth::user();
        
        if (!$user) {
            return 'unknown';
        }

        if ($this->isSuperAdmin($user)) {
            return 'super_admin';
        }

        if ($this->isBranchAdmin($user)) {
            return 'branch_admin';
        }

        // Return the role attribute or map from role_as
        if (isset($user->role)) {
            return strtolower($user->role);
        }

        $roleMap = [
            3 => 'cashier',
            4 => 'pharmacist',
            5 => 'doctor',
            6 => 'nurse',
            7 => 'patient',
        ];

        return $roleMap[$user->role_as] ?? 'unknown';
    }
}
