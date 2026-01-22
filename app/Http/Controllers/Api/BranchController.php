<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\BranchUserAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BranchController extends Controller
{
    /**
     * Get all branches
     */
    public function index(): JsonResponse
    {
        $branches = Branch::with(['pharmacies', 'activeUserAssignments'])
            ->get()
            ->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'center_name' => $branch->center_name,
                    'register_number' => $branch->register_number,
                    'center_type' => $branch->center_type,
                    'owner_full_name' => $branch->owner_full_name,
                    'owner_contact_number' => $branch->owner_contact_number,
                    'pharmacies_count' => $branch->pharmacies->count(),
                    'active_pharmacies_count' => $branch->pharmacies->where('is_active', true)->count(),
                    'staff_count' => $branch->activeUserAssignments->count(),
                    'created_at' => $branch->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $branches,
        ]);
    }

    /**
     * Get branch details with all related data
     */
    public function show(string $id): JsonResponse
    {
        $branch = Branch::with([
            'pharmacies.inventory',
            'activeUserAssignments.user',
            'pharmacies.stockTransactions' => function($query) {
                $query->latest()->take(50);
            }
        ])->find($id);

        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'Branch not found',
            ], 404);
        }

        // Get statistics
        $stats = [
            'total_pharmacies' => $branch->pharmacies->count(),
            'active_pharmacies' => $branch->pharmacies->where('is_active', true)->count(),
            'total_staff' => $branch->activeUserAssignments->count(),
            'doctors' => $branch->activeUserAssignments->where('role', 'doctor')->count(),
            'pharmacists' => $branch->activeUserAssignments->where('role', 'pharmacist')->count(),
            'nurses' => $branch->activeUserAssignments->where('role', 'nurse')->count(),
            'total_inventory_items' => $branch->pharmacies->sum(function($pharmacy) {
                return $pharmacy->inventory->count();
            }),
            'low_stock_items' => $branch->pharmacies->sum(function($pharmacy) {
                return $pharmacy->inventory->filter(function($item) {
                    return $item->quantity_in_stock <= $item->reorder_level;
                })->count();
            }),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'branch' => $branch,
                'statistics' => $stats,
            ],
        ]);
    }

    /**
     * Create new branch
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'center_name' => 'required|string|max:255',
            'register_number' => 'nullable|string|max:100',
            'center_type' => 'nullable|string|max:100',
            'owner_type' => 'nullable|string|max:100',
            'owner_full_name' => 'nullable|string|max:255',
            'owner_id_number' => 'nullable|string|max:100',
            'owner_contact_number' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $branch = Branch::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Branch created successfully',
            'data' => $branch,
        ], 201);
    }

    /**
     * Update branch
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $branch = Branch::find($id);

        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'Branch not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'center_name' => 'sometimes|string|max:255',
            'register_number' => 'nullable|string|max:100',
            'center_type' => 'nullable|string|max:100',
            'owner_type' => 'nullable|string|max:100',
            'owner_full_name' => 'nullable|string|max:255',
            'owner_id_number' => 'nullable|string|max:100',
            'owner_contact_number' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $branch->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Branch updated successfully',
            'data' => $branch,
        ]);
    }

    /**
     * Delete branch
     */
    public function destroy(string $id): JsonResponse
    {
        $branch = Branch::find($id);

        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'Branch not found',
            ], 404);
        }

        $branch->delete();

        return response()->json([
            'success' => true,
            'message' => 'Branch deleted successfully',
        ]);
    }

    /**
     * Get branch staff
     */
    public function staff(string $id): JsonResponse
    {
        $branch = Branch::find($id);

        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'Branch not found',
            ], 404);
        }

        $staff = BranchUserAssignment::with('user')
            ->where('branch_id', $id)
            ->where('is_active', true)
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'user_id' => $assignment->user_id,
                    'user_name' => $assignment->user->first_name . ' ' . $assignment->user->last_name,
                    'user_email' => $assignment->user->email,
                    'role' => $assignment->role,
                    'is_primary_branch' => $assignment->is_primary_branch,
                    'assigned_date' => $assignment->assigned_date,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $staff,
        ]);
    }
}
