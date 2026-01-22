<?php

namespace App\Http\Controllers\Shift;

use Illuminate\Support\Str;
use App\Action\Shift\CreateShift;
use App\Action\Shift\DeleteShift;
use App\Action\Shift\UpdateShift;
use Illuminate\Http\JsonResponse;
use App\Action\Shift\GetAllShifts;
use App\Http\Controllers\Controller;
use App\Action\Shift\GetAllShiftsUserID;
use App\Http\Requests\Shift\CreateShiftRequest;
use App\Http\Requests\Shift\ShiftUpdateRequest;
use App\Models\Shift\Shift;

class ShiftManagementController extends Controller
{
    public function createShift(CreateShiftRequest $request, CreateShift $createShift): JsonResponse
    {
        $validatedShiftCreateRequest = $request->validated();

        if ($validatedShiftCreateRequest) {
            return response()->json($createShift($validatedShiftCreateRequest));
        }

        return response()->json();
    }

    public function getAllShifts(GetAllShifts $getAllShifts): JsonResponse
    {
        return response()->json($getAllShifts());
    }

    public function updateShift(ShiftUpdateRequest $request, UpdateShift $updateShift, string $id): JsonResponse
    {
        $validated = $request->validated();
        $result = $updateShift($validated, $id);

        return response()->json($result);
    }

    public function deleteShift(string $id, DeleteShift $deleteShift): JsonResponse
    {
        $result = $deleteShift($id);

        return response()->json($result);
    }

    public function getAllShiftsUserID(string $user_id, GetAllShiftsUserID $getAllShiftsUserID): JsonResponse
    {
        if (! Str::isUuid($user_id)) {
            return response()->json(['status' => 'error', 'message' => 'Invalid User ID format.'], 400);
        }

        return response()->json($getAllShiftsUserID($user_id));
    }

    public function assignOvertime(CreateShift $createShift): JsonResponse
    {
        $request = request()->validate([
            'user_id' => 'required|exists:users,id',
            'branch_id' => 'required|exists:branches,id',
            'date' => 'required|date',
            'shift_type' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'hours' => 'required|numeric|min:0.5|max:24',
            'reason' => 'required|string|max:500',
            'assignment_type' => 'required|in:requested,assigned'
        ]);

        // Convert date to day of week (1-7)
        $date = new \DateTime($request['date']);
        $dayOfWeek = $date->format('N'); // 1 (Monday) through 7 (Sunday)
        
        // Get assigned by user (manager)
        $assignedBy = auth()->user();
        $assignedByName = $assignedBy ? $assignedBy->first_name . ' ' . $assignedBy->last_name : 'Manager';
        
        // For overtime, we store it as a one-time shift for the specific day with status in notes
        $overtimeData = [
            'type' => 'OVERTIME',
            'reason' => $request['reason'],
            'hours' => $request['hours'],
            'status' => 'pending_acknowledgment',
            'assignment_type' => $request['assignment_type'],
            'assigned_by' => $assignedByName,
            'assigned_at' => now()->toDateTimeString(),
            'date' => $request['date']
        ];
        
        $shiftData = [
            'user_id' => $request['user_id'],
            'branch_id' => $request['branch_id'],
            'shift_type' => $request['shift_type'],
            'start_time' => $request['start_time'],
            'end_time' => $request['end_time'],
            'days_of_week' => json_encode([(string)$dayOfWeek]), // Store as single day
            'notes' => json_encode($overtimeData)
        ];

        $result = $createShift($shiftData);

        return response()->json([
            'status' => 'success',
            'message' => 'Overtime assigned successfully. User will be notified to accept or reject.',
            'id' => $result['id'] ?? null,
            'data' => $result
        ]);
    }

    public function updateOvertime(string $id, UpdateShift $updateShift): JsonResponse
    {
        $request = request()->validate([
            'user_id' => 'required|exists:users,id',
            'branch_id' => 'required|exists:branches,id',
            'date' => 'required|date',
            'shift_type' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'hours' => 'required|numeric|min:0.5|max:24',
            'reason' => 'required|string|max:500'
        ]);

        // Get the shift to verify it's overtime
        $shift = Shift::find($id);
        
        if (!$shift) {
            return response()->json([
                'status' => 'error',
                'message' => 'Overtime assignment not found'
            ], 404);
        }

        // Parse notes to verify it's overtime
        $notes = json_decode($shift->notes, true);
        if (!is_array($notes) || !isset($notes['type']) || $notes['type'] !== 'OVERTIME') {
            return response()->json([
                'status' => 'error',
                'message' => 'This is not an overtime assignment'
            ], 400);
        }

        // Convert date to day of week
        $date = new \DateTime($request['date']);
        $dayOfWeek = $date->format('N');
        
        // Update overtime data
        $notes['reason'] = $request['reason'];
        $notes['hours'] = $request['hours'];
        $notes['date'] = $request['date'];
        $notes['updated_at'] = now()->toDateTimeString();

        $updateData = [
            'user_id' => $request['user_id'],
            'branch_id' => $request['branch_id'],
            'shift_type' => $request['shift_type'],
            'start_time' => $request['start_time'],
            'end_time' => $request['end_time'],
            'days_of_week' => json_encode([(string)$dayOfWeek]),
            'notes' => json_encode($notes)
        ];

        $updateShift($updateData, $id);

        return response()->json([
            'status' => 'success',
            'message' => 'Overtime updated successfully'
        ]);
    }

    public function deleteOvertime(string $id, DeleteShift $deleteShift): JsonResponse
    {
        // Get the shift to verify it's overtime
        $shift = Shift::find($id);
        
        if (!$shift) {
            return response()->json([
                'status' => 'error',
                'message' => 'Overtime assignment not found'
            ], 404);
        }

        // Parse notes to verify it's overtime (optional check)
        $notes = json_decode($shift->notes, true);
        if (is_array($notes) && isset($notes['type']) && $notes['type'] === 'OVERTIME') {
            // It's confirmed overtime, proceed with deletion
            $result = $deleteShift($id);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Overtime deleted successfully'
            ]);
        }

        // If not overtime, still allow deletion but with warning
        $result = $deleteShift($id);
        
        return response()->json([
            'status' => 'success',
            'message' => 'Shift deleted successfully'
        ]);
    }

    public function acknowledgeOvertime(string $id, UpdateShift $updateShift): JsonResponse
    {
        $request = request()->validate([
            'action' => 'required|in:accept,reject',
            'rejection_reason' => 'required_if:action,reject|nullable|string|max:500'
        ]);

        // Get the shift
        $shift = Shift::find($id);
        
        if (!$shift) {
            return response()->json([
                'status' => 'error',
                'message' => 'Overtime assignment not found'
            ], 404);
        }

        // Check if user is authorized (must be assigned to this shift)
        if ($shift->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to acknowledge this overtime'
            ], 403);
        }

        // Parse existing notes
        $notes = json_decode($shift->notes, true);
        
        if (!is_array($notes) || !isset($notes['type']) || $notes['type'] !== 'OVERTIME') {
            return response()->json([
                'status' => 'error',
                'message' => 'This is not an overtime assignment'
            ], 400);
        }

        // Update status
        if ($request['action'] === 'accept') {
            $notes['status'] = 'accepted';
            $notes['acknowledged_at'] = now()->toDateTimeString();
            $message = 'Overtime accepted successfully';
        } else {
            $notes['status'] = 'rejected_by_user';
            $notes['rejection_reason'] = $request['rejection_reason'];
            $notes['acknowledged_at'] = now()->toDateTimeString();
            $message = 'Overtime rejected successfully';
        }

        // Update the shift
        $updateData = [
            'notes' => json_encode($notes)
        ];

        $updateShift($updateData, $id);

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $notes
        ]);
    }

    public function getUserOvertimeAssignments(): JsonResponse
    {
        $userId = auth()->id();
        
        // Get all shifts for this user where notes contains OVERTIME
        $shifts = Shift::where('user_id', $userId)
            ->get()
            ->filter(function ($shift) {
                $notes = json_decode($shift->notes, true);
                return is_array($notes) && isset($notes['type']) && $notes['type'] === 'OVERTIME';
            })
            ->map(function ($shift) {
                $notes = json_decode($shift->notes, true);
                return [
                    'id' => $shift->id,
                    'shift_type' => $shift->shift_type,
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                    'date' => $notes['date'] ?? null,
                    'hours' => $notes['hours'] ?? 0,
                    'reason' => $notes['reason'] ?? '',
                    'status' => $notes['status'] ?? 'pending_acknowledgment',
                    'assigned_by' => $notes['assigned_by'] ?? 'Manager',
                    'assigned_at' => $notes['assigned_at'] ?? null,
                    'acknowledged_at' => $notes['acknowledged_at'] ?? null,
                    'rejection_reason' => $notes['rejection_reason'] ?? null
                ];
            })
            ->values();

        return response()->json([
            'status' => 'success',
            'data' => $shifts
        ]);
    }
}
