<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\HRM\LeaveType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeaveTypeController extends Controller
{
    /**
     * Get authenticated user from token
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
     * Check if user is super admin
     */
    protected function isSuperAdmin($user): bool
    {
        return $user && $user->role_as === 1;
    }

    /**
     * Get all leave types with branch filtering
     * GET /api/hrm/super-admin/leave-types
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $branchId = $request->query('branch_id');
            
            $query = LeaveType::with('branch')
                ->orderBy('sort_order')
                ->orderBy('name');

            if ($branchId) {
                // Get branch-specific + global leave types
                $query->where(function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId)
                      ->orWhereNull('branch_id');
                });
            }

            $leaveTypes = $query->get();

            return response()->json([
                'status' => 200,
                'leaveTypes' => $leaveTypes,
                'message' => 'Leave types fetched successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error fetching leave types: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific leave type
     * GET /api/hrm/super-admin/leave-types/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $leaveType = LeaveType::with('branch')->find($id);

            if (!$leaveType) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Leave type not found'
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'leaveType' => $leaveType
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error fetching leave type: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new leave type
     * POST /api/hrm/super-admin/leave-types
     */
    public function store(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'branch_id' => 'nullable|string',
            'description' => 'nullable|string',
            'default_days' => 'required|integer|min:0',
            'is_paid' => 'boolean',
            'carry_forward' => 'boolean',
            'max_carry_forward_days' => 'integer|min:0',
            'requires_approval' => 'boolean',
            'min_days_notice' => 'integer|min:0',
            'max_consecutive_days' => 'nullable|integer|min:1',
            'eligibility' => 'nullable|string',
            'min_service_months' => 'integer|min:0',
            'requires_document' => 'boolean',
            'document_type' => 'nullable|string',
            'deduction_rate' => 'numeric|min:0|max:100',
            'affects_attendance' => 'boolean',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $branchId = $request->branch_id;
            if ($branchId === 'global' || $branchId === 'all' || $branchId === '') {
                $branchId = null;
            }

            // Check for duplicate code in same branch/global scope
            $existing = LeaveType::where('code', $request->code)
                ->where('branch_id', $branchId)
                ->first();

            if ($existing) {
                return response()->json([
                    'status' => 422,
                    'message' => 'A leave type with this code already exists for this scope'
                ], 422);
            }

            $leaveType = LeaveType::create([
                'branch_id' => $branchId,
                'name' => $request->name,
                'code' => strtolower($request->code),
                'description' => $request->description,
                'default_days' => $request->default_days ?? 0,
                'is_paid' => $request->is_paid ?? true,
                'carry_forward' => $request->carry_forward ?? false,
                'max_carry_forward_days' => $request->max_carry_forward_days ?? 0,
                'requires_approval' => $request->requires_approval ?? true,
                'min_days_notice' => $request->min_days_notice ?? 0,
                'max_consecutive_days' => $request->max_consecutive_days,
                'eligibility' => $request->eligibility ?? 'all',
                'min_service_months' => $request->min_service_months ?? 0,
                'requires_document' => $request->requires_document ?? false,
                'document_type' => $request->document_type,
                'deduction_rate' => $request->deduction_rate ?? 0,
                'affects_attendance' => $request->affects_attendance ?? true,
                'color' => $request->color ?? '#3B82F6',
                'icon' => $request->icon,
                'sort_order' => $request->sort_order ?? 0,
                'is_active' => $request->is_active ?? true,
                'created_by' => $user->id,
            ]);

            return response()->json([
                'status' => 201,
                'message' => 'Leave type created successfully',
                'leaveType' => $leaveType->load('branch')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error creating leave type: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a leave type
     * PUT /api/hrm/super-admin/leave-types/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:20',
            'branch_id' => 'nullable|string',
            'description' => 'nullable|string',
            'default_days' => 'sometimes|required|integer|min:0',
            'is_paid' => 'boolean',
            'carry_forward' => 'boolean',
            'max_carry_forward_days' => 'integer|min:0',
            'requires_approval' => 'boolean',
            'min_days_notice' => 'integer|min:0',
            'max_consecutive_days' => 'nullable|integer|min:1',
            'eligibility' => 'nullable|string',
            'min_service_months' => 'integer|min:0',
            'requires_document' => 'boolean',
            'document_type' => 'nullable|string',
            'deduction_rate' => 'numeric|min:0|max:100',
            'affects_attendance' => 'boolean',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $leaveType = LeaveType::find($id);

            if (!$leaveType) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Leave type not found'
                ], 404);
            }

            $branchId = $request->branch_id;
            if ($branchId === 'global' || $branchId === 'all' || $branchId === '') {
                $branchId = null;
            }

            // Check for duplicate code if code is being changed
            if ($request->has('code') && $request->code !== $leaveType->code) {
                $existing = LeaveType::where('code', $request->code)
                    ->where('branch_id', $branchId ?? $leaveType->branch_id)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existing) {
                    return response()->json([
                        'status' => 422,
                        'message' => 'A leave type with this code already exists for this scope'
                    ], 422);
                }
            }

            $updateData = array_filter([
                'name' => $request->name,
                'code' => $request->code ? strtolower($request->code) : null,
                'description' => $request->description,
                'default_days' => $request->default_days,
                'is_paid' => $request->is_paid,
                'carry_forward' => $request->carry_forward,
                'max_carry_forward_days' => $request->max_carry_forward_days,
                'requires_approval' => $request->requires_approval,
                'min_days_notice' => $request->min_days_notice,
                'max_consecutive_days' => $request->max_consecutive_days,
                'eligibility' => $request->eligibility,
                'min_service_months' => $request->min_service_months,
                'requires_document' => $request->requires_document,
                'document_type' => $request->document_type,
                'deduction_rate' => $request->deduction_rate,
                'affects_attendance' => $request->affects_attendance,
                'color' => $request->color,
                'icon' => $request->icon,
                'sort_order' => $request->sort_order,
                'is_active' => $request->is_active,
                'updated_by' => $user->id,
            ], fn($value) => $value !== null);

            if ($request->has('branch_id')) {
                $updateData['branch_id'] = $branchId;
            }

            $leaveType->update($updateData);

            return response()->json([
                'status' => 200,
                'message' => 'Leave type updated successfully',
                'leaveType' => $leaveType->fresh()->load('branch')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error updating leave type: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a leave type
     * DELETE /api/hrm/super-admin/leave-types/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $leaveType = LeaveType::find($id);

            if (!$leaveType) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Leave type not found'
                ], 404);
            }

            $leaveType->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Leave type deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error deleting leave type: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Initialize with Sri Lanka default leave types
     * POST /api/hrm/super-admin/leave-types/initialize
     */
    public function initialize(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $branchId = $request->branch_id;
            if ($branchId === 'global' || $branchId === 'all' || $branchId === '') {
                $branchId = null;
            }

            // Check if leave types already exist for this scope
            $existingCount = LeaveType::where('branch_id', $branchId)->count();
            if ($existingCount > 0) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Leave types already exist for this scope. Delete existing ones first or add manually.'
                ], 422);
            }

            $defaults = LeaveType::getSriLankaDefaults();
            $created = [];

            foreach ($defaults as $default) {
                $leaveType = LeaveType::create(array_merge($default, [
                    'branch_id' => $branchId,
                    'created_by' => $user->id,
                ]));
                $created[] = $leaveType;
            }

            return response()->json([
                'status' => 201,
                'message' => 'Sri Lanka default leave types initialized successfully',
                'leaveTypes' => $created,
                'count' => count($created)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error initializing leave types: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Copy leave types from one branch to another
     * POST /api/hrm/super-admin/leave-types/copy-to-branch
     */
    public function copyToBranch(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'source_branch_id' => 'nullable|string',
            'target_branch_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $sourceBranchId = $request->source_branch_id;
            if ($sourceBranchId === 'global' || $sourceBranchId === 'all' || $sourceBranchId === '') {
                $sourceBranchId = null;
            }

            $targetBranchId = $request->target_branch_id;
            if ($targetBranchId === 'global' || $targetBranchId === 'all' || $targetBranchId === '') {
                $targetBranchId = null;
            }

            // Verify target branch exists (if not global)
            if ($targetBranchId) {
                $targetBranch = Branch::find($targetBranchId);
                if (!$targetBranch) {
                    return response()->json([
                        'status' => 404,
                        'message' => 'Target branch not found'
                    ], 404);
                }
            }

            // Get source leave types
            $sourceLeaveTypes = LeaveType::where('branch_id', $sourceBranchId)->get();

            if ($sourceLeaveTypes->isEmpty()) {
                return response()->json([
                    'status' => 404,
                    'message' => 'No leave types found in source'
                ], 404);
            }

            $copied = [];
            $skipped = [];

            foreach ($sourceLeaveTypes as $source) {
                // Check if already exists in target
                $existing = LeaveType::where('code', $source->code)
                    ->where('branch_id', $targetBranchId)
                    ->first();

                if ($existing) {
                    $skipped[] = $source->name;
                    continue;
                }

                $newLeaveType = LeaveType::create([
                    'branch_id' => $targetBranchId,
                    'name' => $source->name,
                    'code' => $source->code,
                    'description' => $source->description,
                    'default_days' => $source->default_days,
                    'is_paid' => $source->is_paid,
                    'carry_forward' => $source->carry_forward,
                    'max_carry_forward_days' => $source->max_carry_forward_days,
                    'requires_approval' => $source->requires_approval,
                    'min_days_notice' => $source->min_days_notice,
                    'max_consecutive_days' => $source->max_consecutive_days,
                    'eligibility' => $source->eligibility,
                    'min_service_months' => $source->min_service_months,
                    'requires_document' => $source->requires_document,
                    'document_type' => $source->document_type,
                    'deduction_rate' => $source->deduction_rate,
                    'affects_attendance' => $source->affects_attendance,
                    'color' => $source->color,
                    'icon' => $source->icon,
                    'sort_order' => $source->sort_order,
                    'is_active' => $source->is_active,
                    'created_by' => $user->id,
                ]);
                $copied[] = $newLeaveType;
            }

            return response()->json([
                'status' => 200,
                'message' => count($copied) . ' leave types copied successfully' . 
                    (count($skipped) > 0 ? '. ' . count($skipped) . ' skipped (already exist)' : ''),
                'copied' => count($copied),
                'skipped' => count($skipped),
                'skippedNames' => $skipped
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error copying leave types: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get leave type statistics
     * GET /api/hrm/super-admin/leave-types/stats
     */
    public function getStats(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $totalLeaveTypes = LeaveType::count();
            $globalLeaveTypes = LeaveType::whereNull('branch_id')->count();
            $activeLeaveTypes = LeaveType::where('is_active', true)->count();
            $paidLeaveTypes = LeaveType::where('is_paid', true)->count();
            $unpaidLeaveTypes = LeaveType::where('is_paid', false)->count();

            // Leave types per branch
            $branchStats = Branch::select('branches.id', 'branches.center_name')
                ->selectRaw('(SELECT COUNT(*) FROM leave_types WHERE leave_types.branch_id = branches.id) as leave_type_count')
                ->get();

            return response()->json([
                'status' => 200,
                'stats' => [
                    'total' => $totalLeaveTypes,
                    'global' => $globalLeaveTypes,
                    'active' => $activeLeaveTypes,
                    'paid' => $paidLeaveTypes,
                    'unpaid' => $unpaidLeaveTypes,
                    'byBranch' => $branchStats
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error fetching stats: ' . $e->getMessage()
            ], 500);
        }
    }
}
