<?php

namespace App\Http\Controllers\LeavesManagement;

use Exception;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Action\Hospital\Leave\CreateLeave;
use App\Action\Hospital\Leave\LeaveManage;
use App\Action\Hospital\Leave\GetAllLeaves;
use App\Action\Hospital\Leave\AdminLeaveManage;
use App\Action\Hospital\Leave\GetLeavesByUserID;
use App\Action\Hospital\Leave\GetLeavesByAssignerID;
use App\Http\Requests\Hospital\Leaves\LeaveApproveReject;
use App\Http\Requests\Hospital\Leaves\LeaveCreateRequest;

class LeavesManagementController extends Controller
{
    public function addLeaves(LeaveCreateRequest $request, CreateLeave $createLeave): JsonResponse
    {
        $validatedLeaveCreateData = $request->validated();

        if ($validatedLeaveCreateData) {
            return response()->json($createLeave($validatedLeaveCreateData));
        }

        return response()->json();
    }

    public function getLeavesByUserID(string $user_id, GetLeavesByUserID $getLeavesByUserID): JsonResponse
    {
        try {
            if (! Str::isUuid($user_id)) {
                return response()->json(['status' => 'error', 'message' => 'Invalid User ID format.'], 400);
            }

            return response()->json($getLeavesByUserID($user_id));
        } catch (Exception $e) {
            Log::error('Error fetching leaves for user_id: '.$user_id.' - '.$e->getMessage());

            return response()->json(['status' => 'error', 'message' => 'An error occurred while fetching leaves.'], 500);
        }
    }

    public function getAllLeaves(GetAllLeaves $getAllLeaves): JsonResponse
    {
        return response()->json($getAllLeaves());
    }

    public function getLeavesByAssignerID(string $assigner_id, GetLeavesByAssignerID $getLeavesByAssignerID): JsonResponse
    {
        try {
            if (! Str::isUuid($assigner_id)) {
                return response()->json(['status' => 'error', 'message' => 'Invalid User ID format.'], 400);
            }

            return response()->json($getLeavesByAssignerID($assigner_id));
        } catch (Exception $e) {
            Log::error('Error fetching leaves for assigner_id: '.$assigner_id.' - '.$e->getMessage());

            return response()->json(['status' => 'error', 'message' => 'An error occurred while fetching leaves.'], 500);
        }
    }

    public function leaveApprove(LeaveApproveReject $request): JsonResponse
    {
        $validated = $request->validated();

        $manager = new LeaveManage($validated['id']);

        return response()->json($manager->handleApprovalOrRejection('approve', $validated['comments'] ?? null));
    }

    public function leaveReject(LeaveApproveReject $request): JsonResponse
    {
        $validated = $request->validated();

        $manager = new LeaveManage($validated['id']);

        return response()->json($manager->handleApprovalOrRejection('reject', $validated['comments'] ?? null));
    }

    public function adminLeaveApprove(LeaveApproveReject $request): JsonResponse
    {
        $validated = $request->validated();

        $manager = new AdminLeaveManage($validated['id']);

        return response()->json(
            $manager->adminHandleApprovalOrRejection('approve', $validated['comments'] ?? null)
        );
    }

    public function adminLeaveReject(LeaveApproveReject $request): JsonResponse
    {
        $validated = $request->validated();

        $manager = new AdminLeaveManage($validated['id']);

        return response()->json(
            $manager->adminHandleApprovalOrRejection('reject', $validated['comments'] ?? null)
        );
    }
}
