<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Models\AllUsers\User;
use App\Models\UserResignation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class UserResignationController extends Controller
{
    /**
     * Get all resignation reasons for dropdown
     */
    public function getReasons(): JsonResponse
    {
        return response()->json([
            'status' => 200,
            'reasons' => UserResignation::REASONS,
        ]);
    }

    /**
     * Get all resignations with optional filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = UserResignation::with(['user', 'processedBy']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $resignations = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 200,
            'resignations' => $resignations,
        ]);
    }

    /**
     * Get resignation by user ID
     */
    public function getByUser(string $userId): JsonResponse
    {
        $resignation = UserResignation::with(['user', 'processedBy'])
            ->where('user_id', $userId)
            ->latest()
            ->first();

        if (!$resignation) {
            return response()->json([
                'status' => 404,
                'message' => 'No resignation record found for this user',
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'resignation' => $resignation,
        ]);
    }

    /**
     * Create a new resignation record
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'resignation_date' => 'required|date',
            'last_working_date' => 'required|date|after_or_equal:resignation_date',
            'reason' => 'required|string|in:' . implode(',', array_keys(UserResignation::REASONS)),
            'reason_details' => 'nullable|string|max:1000',
            'final_salary' => 'required|numeric|min:0',
            'pending_leaves_payment' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if user already has a pending/approved resignation
        $existingResignation = UserResignation::where('user_id', $request->user_id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existingResignation) {
            return response()->json([
                'status' => 400,
                'message' => 'This user already has a pending or approved resignation',
            ], 400);
        }

        // Calculate total final pay
        $finalSalary = floatval($request->final_salary ?? 0);
        $pendingLeaves = floatval($request->pending_leaves_payment ?? 0);
        $deductions = floatval($request->deductions ?? 0);
        $totalFinalPay = $finalSalary + $pendingLeaves - $deductions;

        $resignation = UserResignation::create([
            'user_id' => $request->user_id,
            'resignation_date' => $request->resignation_date,
            'last_working_date' => $request->last_working_date,
            'reason' => $request->reason,
            'reason_details' => $request->reason_details,
            'final_salary' => $finalSalary,
            'pending_leaves_payment' => $pendingLeaves,
            'deductions' => $deductions,
            'total_final_pay' => $totalFinalPay,
            'status' => 'pending',
            'processed_by' => Auth::id(),
            'notes' => $request->notes,
        ]);

        // Update user employment status
        User::where('id', $request->user_id)->update([
            'employment_status' => 'resigned',
        ]);

        return response()->json([
            'status' => 201,
            'message' => 'Resignation record created successfully',
            'resignation' => $resignation->load(['user', 'processedBy']),
        ], 201);
    }

    /**
     * Update resignation status
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:pending,approved,rejected,completed',
            'notes' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $resignation = UserResignation::find($id);

        if (!$resignation) {
            return response()->json([
                'status' => 404,
                'message' => 'Resignation record not found',
            ], 404);
        }

        $resignation->update([
            'status' => $request->status,
            'notes' => $request->notes ?? $resignation->notes,
            'processed_by' => Auth::id(),
        ]);

        // Update user employment status based on resignation status
        if ($request->status === 'completed') {
            User::where('id', $resignation->user_id)->update([
                'employment_status' => 'resigned',
            ]);
        } elseif ($request->status === 'rejected') {
            User::where('id', $resignation->user_id)->update([
                'employment_status' => 'active',
            ]);
        }

        return response()->json([
            'status' => 200,
            'message' => 'Resignation status updated successfully',
            'resignation' => $resignation->load(['user', 'processedBy']),
        ]);
    }

    /**
     * Delete resignation record
     */
    public function destroy(string $id): JsonResponse
    {
        $resignation = UserResignation::find($id);

        if (!$resignation) {
            return response()->json([
                'status' => 404,
                'message' => 'Resignation record not found',
            ], 404);
        }

        // Restore user employment status
        User::where('id', $resignation->user_id)->update([
            'employment_status' => 'active',
        ]);

        $resignation->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Resignation record deleted successfully',
        ]);
    }
}
