<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BranchUserAssignment;
use App\Models\AllUsers\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BranchStaffController extends Controller
{
    /**
     * Get all staff assignments or filter by branch
     */
    public function index(Request $request): JsonResponse
    {
        $query = BranchUserAssignment::with(['user', 'branch']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $assignments = $query->get()->map(function ($assignment) {
            return [
                'id' => $assignment->id,
                'user_id' => $assignment->user_id,
                'user_name' => $assignment->user->first_name . ' ' . $assignment->user->last_name,
                'user_email' => $assignment->user->email,
                'branch_id' => $assignment->branch_id,
                'branch_name' => $assignment->branch->center_name,
                'role' => $assignment->role,
                'is_primary_branch' => $assignment->is_primary_branch,
                'assigned_date' => $assignment->assigned_date,
                'end_date' => $assignment->end_date,
                'is_active' => $assignment->is_active,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    /**
     * Assign staff to branch
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'branch_id' => 'required|exists:branches,id',
            'role' => 'required|string|in:branch_admin,doctor,nurse,pharmacist,cashier,receptionist,it_support,center_aid,auditor',
            'is_primary_branch' => 'boolean',
            'assigned_date' => 'required|date',
            'end_date' => 'nullable|date|after:assigned_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if assignment already exists
        $existing = BranchUserAssignment::where('user_id', $request->user_id)
            ->where('branch_id', $request->branch_id)
            ->where('is_active', true)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'User is already assigned to this branch',
            ], 400);
        }

        $assignment = BranchUserAssignment::create(array_merge(
            $validator->validated(),
            ['is_active' => true]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Staff assigned to branch successfully',
            'data' => $assignment->load(['user', 'branch']),
        ], 201);
    }

    /**
     * Update staff assignment
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $assignment = BranchUserAssignment::find($id);

        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'Assignment not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'role' => 'sometimes|string|in:branch_admin,doctor,nurse,pharmacist,cashier,receptionist,it_support,center_aid,auditor',
            'is_primary_branch' => 'boolean',
            'assigned_date' => 'sometimes|date',
            'end_date' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $assignment->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Assignment updated successfully',
            'data' => $assignment->load(['user', 'branch']),
        ]);
    }

    /**
     * Remove staff assignment
     */
    public function destroy(string $id): JsonResponse
    {
        $assignment = BranchUserAssignment::find($id);

        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'Assignment not found',
            ], 404);
        }

        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Staff assignment removed successfully',
        ]);
    }

    /**
     * Get user's branch assignments
     */
    public function userAssignments(string $userId): JsonResponse
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        $assignments = BranchUserAssignment::with('branch')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }
}
