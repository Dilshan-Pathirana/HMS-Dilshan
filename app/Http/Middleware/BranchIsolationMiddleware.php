<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

/**
 * Branch Isolation Middleware
 * 
 * Ensures users can only access data from their assigned branch.
 * Super Admins can access all branches, but must explicitly specify branch_id.
 * 
 * Security Rules:
 * 1. Cashiers, Pharmacists, Nurses, etc. - can ONLY access their own branch
 * 2. Branch Admins - can ONLY access their own branch
 * 3. Super Admins - can access any branch (must specify branch_id in request)
 */
class BranchIsolationMiddleware
{
    /**
     * Roles that are restricted to their own branch only
     */
    protected array $branchRestrictedRoles = [
        'cashier',
        'pharmacist',
        'nurse',
        'receptionist',
        'doctor',
        'branch_admin',
        'therapist',
        'phlebotomist',
        'medical_technologist',
        'radiology_technologist',
    ];

    /**
     * Roles that can access all branches
     */
    protected array $superRoles = [
        'super_admin',
        'admin', // Legacy admin role
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized. Authentication required.',
            ], 401);
        }

        // Get user's role
        $userRole = $this->getUserRole($user);

        // Super admins can access any branch but must respect explicit branch_id parameter
        if ($this->isSuperRole($user)) {
            // If super admin specifies a branch_id, validate it exists
            $requestedBranchId = $this->getRequestedBranchId($request);
            if ($requestedBranchId) {
                $branchExists = \App\Models\Branch::where('id', $requestedBranchId)->exists();
                if (!$branchExists) {
                    return response()->json([
                        'status' => 404,
                        'message' => 'Branch not found.',
                    ], 404);
                }
            }
            return $next($request);
        }

        // For branch-restricted users, ensure they have a branch assigned
        if (!$user->branch_id) {
            Log::warning('Branch isolation: User without branch_id attempted access', [
                'user_id' => $user->id,
                'role' => $userRole,
                'path' => $request->path(),
            ]);
            
            return response()->json([
                'status' => 403,
                'message' => 'Access denied. No branch assigned to user.',
            ], 403);
        }

        // Check if user is trying to access a different branch
        $requestedBranchId = $this->getRequestedBranchId($request);
        
        if ($requestedBranchId && $requestedBranchId != $user->branch_id) {
            Log::warning('Branch isolation violation attempt', [
                'user_id' => $user->id,
                'user_branch' => $user->branch_id,
                'requested_branch' => $requestedBranchId,
                'role' => $userRole,
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);
            
            return response()->json([
                'status' => 403,
                'message' => 'Access denied. Cross-branch access not permitted.',
            ], 403);
        }

        // Inject user's branch_id into request for consistency
        $request->merge(['_user_branch_id' => $user->branch_id]);

        return $next($request);
    }

    /**
     * Get the branch_id from the request (query params, route params, or body)
     */
    protected function getRequestedBranchId(Request $request): ?int
    {
        // Check route parameter first
        if ($request->route('branch_id')) {
            return (int) $request->route('branch_id');
        }

        // Check query parameter
        if ($request->has('branch_id')) {
            return (int) $request->input('branch_id');
        }

        // Check request body
        if ($request->has('branch_id') && $request->isMethod('post')) {
            return (int) $request->input('branch_id');
        }

        return null;
    }

    /**
     * Get the user's role name
     */
    protected function getUserRole($user): string
    {
        // Check role attribute first
        if (isset($user->role)) {
            return strtolower($user->role);
        }

        // Map role_as to role name
        $roleMap = [
            1 => 'super_admin',
            2 => 'branch_admin',
            3 => 'cashier',
            4 => 'pharmacist',
            5 => 'doctor',
            6 => 'nurse',
            7 => 'patient',
        ];

        return $roleMap[$user->role_as] ?? 'unknown';
    }

    /**
     * Check if user has super admin privileges
     */
    protected function isSuperRole($user): bool
    {
        // Check token abilities
        if ($user->tokenCan('server:super-admin')) {
            return true;
        }

        // Check role_as
        if ($user->role_as === 1) {
            return true;
        }

        // Check role attribute
        if (isset($user->role) && in_array(strtolower($user->role), $this->superRoles)) {
            return true;
        }

        return false;
    }
}
