<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\HRPolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class HRPolicyController extends Controller
{
    /**
     * Get the authenticated user
     */
    protected function getAuthenticatedUser(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }
        
        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
        if (!$accessToken) {
            return null;
        }
        
        return $accessToken->tokenable;
    }

    /**
     * Check if user is Super Admin
     */
    protected function isSuperAdmin($user): bool
    {
        return $user && $user->role_as === 1;
    }

    /**
     * Get all HR policies with filters
     * GET /api/hrm/super-admin/policies
     */
    public function index(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. Super Admin access required.'
            ], 403);
        }

        try {
            $query = HRPolicy::with(['branch:id,center_name', 'creator:id,first_name,last_name,email', 'updater:id,first_name,last_name,email']);

            // Filter by branch
            if ($request->has('branch_id') && $request->branch_id !== 'all') {
                if ($request->branch_id === 'global') {
                    $query->whereNull('branch_id');
                } else {
                    $query->where('branch_id', $request->branch_id);
                }
            }

            // Filter by category
            if ($request->has('category') && $request->category !== 'all') {
                $query->where('policy_category', $request->category);
            }

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Search by name or description
            if ($request->has('search') && $request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('policy_name', 'like', '%' . $request->search . '%')
                      ->orWhere('description', 'like', '%' . $request->search . '%');
                });
            }

            $policies = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'status' => 200,
                'policies' => $policies
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch policies',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single policy details
     * GET /api/hrm/super-admin/policies/{id}
     */
    public function show(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized.'
            ], 403);
        }

        try {
            $policy = HRPolicy::with(['creator', 'updater'])->findOrFail($id);

            return response()->json([
                'status' => 200,
                'policy' => $policy
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Policy not found'
            ], 404);
        }
    }

    /**
     * Create new HR policy
     * POST /api/hrm/super-admin/policies
     */
    public function store(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized.'
            ], 403);
        }

        $validated = $request->validate([
            'branch_id' => 'nullable|uuid',
            'policy_name' => 'required|string|max:255',
            'policy_category' => 'required|string',
            'description' => 'required|string',
            'policy_content' => 'nullable|string',
            'effective_date' => 'required|date',
            'expiry_date' => 'nullable|date|after:effective_date',
            'status' => 'required|in:Active,Inactive,Draft',
        ]);

        try {
            $policy = HRPolicy::create([
                'branch_id' => $validated['branch_id'] ?? null,
                'policy_name' => $validated['policy_name'],
                'policy_category' => $validated['policy_category'],
                'description' => $validated['description'],
                'policy_content' => $validated['policy_content'] ?? null,
                'effective_date' => $validated['effective_date'],
                'expiry_date' => $validated['expiry_date'] ?? null,
                'status' => $validated['status'],
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            return response()->json([
                'status' => 201,
                'message' => 'Policy created successfully',
                'policy' => $policy
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create policy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update existing policy
     * PUT /api/hrm/super-admin/policies/{id}
     */
    public function update(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized.'
            ], 403);
        }

        $validated = $request->validate([
            'branch_id' => 'nullable|uuid',
            'policy_name' => 'required|string|max:255',
            'policy_category' => 'required|string',
            'description' => 'required|string',
            'policy_content' => 'nullable|string',
            'effective_date' => 'required|date',
            'expiry_date' => 'nullable|date|after:effective_date',
            'status' => 'required|in:Active,Inactive,Draft',
        ]);

        try {
            $policy = HRPolicy::findOrFail($id);
            
            $policy->update([
                'branch_id' => $validated['branch_id'] ?? null,
                'policy_name' => $validated['policy_name'],
                'policy_category' => $validated['policy_category'],
                'description' => $validated['description'],
                'policy_content' => $validated['policy_content'] ?? null,
                'effective_date' => $validated['effective_date'],
                'expiry_date' => $validated['expiry_date'] ?? null,
                'status' => $validated['status'],
                'updated_by' => $user->id,
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Policy updated successfully',
                'policy' => $policy
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update policy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete policy
     * DELETE /api/hrm/super-admin/policies/{id}
     */
    public function destroy(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized.'
            ], 403);
        }

        try {
            $policy = HRPolicy::findOrFail($id);
            $policy->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Policy deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete policy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get policy statistics
     * GET /api/hrm/super-admin/policies/stats
     */
    public function getStats(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized.'
            ], 403);
        }

        try {
            $query = HRPolicy::query();
            
            // Filter by branch if specified
            if ($request->has('branch_id') && $request->branch_id !== 'all') {
                if ($request->branch_id === 'global') {
                    $query->whereNull('branch_id');
                } else {
                    $query->where('branch_id', $request->branch_id);
                }
            }

            $totalPolicies = (clone $query)->count();
            $activePolicies = (clone $query)->where('status', 'Active')->count();
            $draftPolicies = (clone $query)->where('status', 'Draft')->count();
            $expiringSoon = (clone $query)->where('status', 'Active')
                ->whereNotNull('expiry_date')
                ->whereBetween('expiry_date', [now(), now()->addDays(30)])
                ->count();

            $byCategory = (clone $query)->selectRaw('policy_category, COUNT(*) as count')
                ->groupBy('policy_category')
                ->get();

            return response()->json([
                'status' => 200,
                'stats' => [
                    'total' => $totalPolicies,
                    'active' => $activePolicies,
                    'draft' => $draftPolicies,
                    'expiring_soon' => $expiringSoon,
                    'by_category' => $byCategory
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Copy policies to another branch
     * POST /api/hrm/super-admin/policies/copy-to-branch
     */
    public function copyToBranch(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized.'
            ], 403);
        }

        $validated = $request->validate([
            'source_branch_id' => 'nullable|string',
            'target_branch_id' => 'required|uuid',
        ]);

        try {
            // Handle source branch - treat 'all', 'global', empty string as null (global policies)
            $sourceBranchId = $validated['source_branch_id'];
            if (in_array($sourceBranchId, ['all', 'global', '', null], true)) {
                $sourceBranchId = null;
            }

            // Get source policies
            $query = HRPolicy::query();
            if ($sourceBranchId) {
                $query->where('branch_id', $sourceBranchId);
            } else {
                $query->whereNull('branch_id');
            }
            $sourcePolicies = $query->get();

            if ($sourcePolicies->isEmpty()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'No policies found in source branch'
                ], 400);
            }

            $copiedCount = 0;
            foreach ($sourcePolicies as $policy) {
                // Check if similar policy exists in target branch
                $exists = HRPolicy::where('branch_id', $validated['target_branch_id'])
                    ->where('policy_name', $policy->policy_name)
                    ->exists();

                if (!$exists) {
                    HRPolicy::create([
                        'branch_id' => $validated['target_branch_id'],
                        'policy_name' => $policy->policy_name,
                        'policy_category' => $policy->policy_category,
                        'description' => $policy->description,
                        'policy_content' => $policy->policy_content,
                        'effective_date' => $policy->effective_date,
                        'expiry_date' => $policy->expiry_date,
                        'status' => $policy->status,
                        'created_by' => $user->id,
                        'updated_by' => $user->id,
                    ]);
                    $copiedCount++;
                }
            }

            return response()->json([
                'status' => 200,
                'message' => "Successfully copied {$copiedCount} policies to target branch",
                'copied_count' => $copiedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to copy policies',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
