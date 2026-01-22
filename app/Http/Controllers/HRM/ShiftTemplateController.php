<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\HRM\ShiftTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShiftTemplateController extends Controller
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
     * Check if user is Super Admin
     */
    protected function isSuperAdmin($user): bool
    {
        return $user && $user->role === 'super_admin';
    }

    /**
     * Get all shift templates
     * GET /api/hrm/super-admin/shift-templates
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
            $query = ShiftTemplate::with('branch');

            // Filter by branch
            if ($request->has('branch_id')) {
                $branchId = $request->branch_id;
                if ($branchId === 'global' || $branchId === '') {
                    $query->whereNull('branch_id');
                } elseif ($branchId !== 'all') {
                    $query->where('branch_id', $branchId);
                }
            }

            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->is_active === 'true' || $request->is_active === '1');
            }

            // Filter by overnight
            if ($request->has('overnight_shift')) {
                $query->where('overnight_shift', $request->overnight_shift === 'true' || $request->overnight_shift === '1');
            }

            // Search
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('shift_name', 'like', "%{$search}%")
                      ->orWhere('shift_code', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $shiftTemplates = $query->orderBy('start_time')->get();

            return response()->json([
                'status' => 200,
                'shiftTemplates' => $shiftTemplates,
                'count' => $shiftTemplates->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error fetching shift templates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single shift template
     * GET /api/hrm/super-admin/shift-templates/{id}
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
            $shiftTemplate = ShiftTemplate::with('branch')->find($id);

            if (!$shiftTemplate) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Shift template not found'
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'shiftTemplate' => $shiftTemplate
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error fetching shift template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new shift template
     * POST /api/hrm/super-admin/shift-templates
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
            'shift_name' => 'required|string|max:100',
            'shift_code' => 'nullable|string|max:20',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'standard_hours' => 'nullable|numeric|min:0|max:24',
            'break_duration' => 'nullable|numeric|min:0|max:4',
            'overnight_shift' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string|max:500',
            'applicable_roles' => 'nullable|array',
            'applicable_days' => 'nullable|array',
            'branch_id' => 'nullable|string',
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
            if ($request->shift_code) {
                $existing = ShiftTemplate::where('shift_code', strtoupper($request->shift_code))
                    ->where('branch_id', $branchId)
                    ->first();

                if ($existing) {
                    return response()->json([
                        'status' => 422,
                        'message' => 'A shift template with this code already exists for this scope'
                    ], 422);
                }
            }

            $shiftTemplate = ShiftTemplate::create([
                'branch_id' => $branchId,
                'shift_name' => $request->shift_name,
                'shift_code' => $request->shift_code ? strtoupper($request->shift_code) : null,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'standard_hours' => $request->standard_hours ?? 8.00,
                'break_duration' => $request->break_duration ?? 0.50,
                'overnight_shift' => $request->overnight_shift ?? false,
                'is_active' => $request->is_active ?? true,
                'description' => $request->description,
                'applicable_roles' => $request->applicable_roles ?? [],
                'applicable_days' => $request->applicable_days ?? [],
            ]);

            return response()->json([
                'status' => 201,
                'message' => 'Shift template created successfully',
                'shiftTemplate' => $shiftTemplate->load('branch')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error creating shift template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a shift template
     * PUT /api/hrm/super-admin/shift-templates/{id}
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
            'shift_name' => 'required|string|max:100',
            'shift_code' => 'nullable|string|max:20',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'standard_hours' => 'nullable|numeric|min:0|max:24',
            'break_duration' => 'nullable|numeric|min:0|max:4',
            'overnight_shift' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string|max:500',
            'applicable_roles' => 'nullable|array',
            'applicable_days' => 'nullable|array',
            'branch_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $shiftTemplate = ShiftTemplate::find($id);

            if (!$shiftTemplate) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Shift template not found'
                ], 404);
            }

            $branchId = $request->branch_id;
            if ($branchId === 'global' || $branchId === 'all' || $branchId === '') {
                $branchId = null;
            }

            // Check for duplicate code in same branch/global scope (excluding current)
            if ($request->shift_code) {
                $existing = ShiftTemplate::where('shift_code', strtoupper($request->shift_code))
                    ->where('branch_id', $branchId)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existing) {
                    return response()->json([
                        'status' => 422,
                        'message' => 'A shift template with this code already exists for this scope'
                    ], 422);
                }
            }

            $shiftTemplate->update([
                'branch_id' => $branchId,
                'shift_name' => $request->shift_name,
                'shift_code' => $request->shift_code ? strtoupper($request->shift_code) : null,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'standard_hours' => $request->standard_hours ?? 8.00,
                'break_duration' => $request->break_duration ?? 0.50,
                'overnight_shift' => $request->overnight_shift ?? false,
                'is_active' => $request->is_active ?? true,
                'description' => $request->description,
                'applicable_roles' => $request->applicable_roles ?? [],
                'applicable_days' => $request->applicable_days ?? [],
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Shift template updated successfully',
                'shiftTemplate' => $shiftTemplate->load('branch')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error updating shift template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a shift template
     * DELETE /api/hrm/super-admin/shift-templates/{id}
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
            $shiftTemplate = ShiftTemplate::find($id);

            if (!$shiftTemplate) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Shift template not found'
                ], 404);
            }

            // TODO: Check if shift template is in use before deleting
            // $assignmentsCount = ShiftAssignment::where('shift_id', $id)->count();
            // if ($assignmentsCount > 0) {
            //     return response()->json([
            //         'status' => 422,
            //         'message' => 'Cannot delete shift template that is in use'
            //     ], 422);
            // }

            $shiftTemplate->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Shift template deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error deleting shift template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Initialize with Sri Lanka default shift templates
     * POST /api/hrm/super-admin/shift-templates/initialize
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

            // Check if shift templates already exist for this scope
            $existingCount = ShiftTemplate::where('branch_id', $branchId)->count();
            if ($existingCount > 0) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Shift templates already exist for this scope. Delete existing ones first or add manually.'
                ], 422);
            }

            $defaults = ShiftTemplate::getSriLankaDefaults();
            $created = [];

            foreach ($defaults as $default) {
                $shiftTemplate = ShiftTemplate::create(array_merge($default, [
                    'branch_id' => $branchId,
                ]));
                $created[] = $shiftTemplate;
            }

            return response()->json([
                'status' => 201,
                'message' => 'Sri Lanka default shift templates initialized successfully',
                'shiftTemplates' => $created,
                'count' => count($created)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error initializing shift templates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Copy shift templates from one branch to another
     * POST /api/hrm/super-admin/shift-templates/copy-to-branch
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

            // Get source shift templates
            $sourceTemplates = ShiftTemplate::where('branch_id', $sourceBranchId)->get();

            if ($sourceTemplates->isEmpty()) {
                return response()->json([
                    'status' => 404,
                    'message' => 'No shift templates found in source'
                ], 404);
            }

            $copied = [];
            $skipped = [];

            foreach ($sourceTemplates as $source) {
                // Check if already exists in target (by code)
                if ($source->shift_code) {
                    $existing = ShiftTemplate::where('shift_code', $source->shift_code)
                        ->where('branch_id', $targetBranchId)
                        ->first();

                    if ($existing) {
                        $skipped[] = $source->shift_name;
                        continue;
                    }
                }

                $newTemplate = ShiftTemplate::create([
                    'branch_id' => $targetBranchId,
                    'shift_name' => $source->shift_name,
                    'shift_code' => $source->shift_code,
                    'start_time' => $source->start_time,
                    'end_time' => $source->end_time,
                    'standard_hours' => $source->standard_hours,
                    'break_duration' => $source->break_duration,
                    'overnight_shift' => $source->overnight_shift,
                    'is_active' => $source->is_active,
                    'description' => $source->description,
                    'applicable_roles' => $source->applicable_roles,
                    'applicable_days' => $source->applicable_days,
                ]);
                $copied[] = $newTemplate;
            }

            return response()->json([
                'status' => 200,
                'message' => count($copied) . ' shift templates copied successfully' . 
                    (count($skipped) > 0 ? '. ' . count($skipped) . ' skipped (already exist)' : ''),
                'copied' => count($copied),
                'skipped' => count($skipped),
                'skippedNames' => $skipped
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error copying shift templates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get shift template statistics
     * GET /api/hrm/super-admin/shift-templates/stats
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
            $totalTemplates = ShiftTemplate::count();
            $globalTemplates = ShiftTemplate::whereNull('branch_id')->count();
            $activeTemplates = ShiftTemplate::where('is_active', true)->count();
            $overnightTemplates = ShiftTemplate::where('overnight_shift', true)->count();
            
            // Templates per branch
            $branchStats = Branch::withCount(['shiftTemplates' => function($q) {
                // This requires relationship to be set up
            }])->get();

            // Get available roles and days for dropdowns
            $availableRoles = ShiftTemplate::getAvailableRoles();
            $daysOfWeek = ShiftTemplate::getDaysOfWeek();

            return response()->json([
                'status' => 200,
                'stats' => [
                    'total' => $totalTemplates,
                    'global' => $globalTemplates,
                    'branchSpecific' => $totalTemplates - $globalTemplates,
                    'active' => $activeTemplates,
                    'inactive' => $totalTemplates - $activeTemplates,
                    'overnight' => $overnightTemplates,
                ],
                'availableRoles' => $availableRoles,
                'daysOfWeek' => $daysOfWeek,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error fetching stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get shift templates for dropdown
     * GET /api/hrm/super-admin/shift-templates/dropdown
     */
    public function getForDropdown(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $query = ShiftTemplate::active();

            // Filter by branch - get both global and branch-specific
            if ($request->has('branch_id') && $request->branch_id) {
                $branchId = $request->branch_id;
                $query->where(function($q) use ($branchId) {
                    $q->whereNull('branch_id')
                      ->orWhere('branch_id', $branchId);
                });
            }

            $templates = $query->orderBy('start_time')
                ->get(['id', 'shift_name', 'shift_code', 'start_time', 'end_time', 'standard_hours', 'branch_id']);

            return response()->json([
                'status' => 200,
                'shiftTemplates' => $templates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error fetching shift templates: ' . $e->getMessage()
            ], 500);
        }
    }
}
