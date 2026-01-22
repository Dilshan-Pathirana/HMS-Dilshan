<?php

namespace App\Http\Controllers\AppointmentSchedule;

use Illuminate\Http\Request;
use App\Response\CommonResponse;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\DoctorSchedule\CreateDoctorSchedule;
use App\Action\DoctorSchedule\DeleteDoctorSchedule;
use App\Action\DoctorSchedule\GetAllDoctorSchedule;
use App\Action\DoctorSchedule\UpdateDoctorSchedule;
use App\Action\DoctorSchedule\GetDoctorScheduleByBranch;
use App\Action\DoctorAppointment\CheckDoctorAvailability;
use App\Action\DoctorSchedule\GetAllDoctorSchedulesFilter;
use App\Action\DoctorSchedule\GetDoctorSchedulesByDoctorId;
use App\Action\DoctorSchedule\RequestDoctorScheduleApproval;
use App\Action\DoctorSchedule\GetDoctorScheduleRequests;
use App\Action\DoctorSchedule\UpdateDoctorScheduleRequest;
use App\Action\DoctorSchedule\CancelDoctorScheduleRequest;
use App\Http\Requests\AppointmentSchedule\DoctorAvailabilityRequest;
use App\Http\Requests\AppointmentSchedule\DoctorScheduleCreateRequest;
use App\Http\Requests\AppointmentSchedule\DoctorScheduleUpdateRequest;

class DoctorScheduleController extends Controller
{
    public function createDoctorSchedule(DoctorScheduleCreateRequest $request, RequestDoctorScheduleApproval $requestApproval): JsonResponse
    {
        $validatedDoctorScheduleCreateRequest = $request->validated();

        if ($validatedDoctorScheduleCreateRequest) {
            return response()->json($requestApproval($validatedDoctorScheduleCreateRequest));
        }

        return response()->json();
    }

    public function getAllDoctorSchedule(GetAllDoctorSchedule $getAllDoctorSchedule): JsonResponse
    {
        return response()->json($getAllDoctorSchedule());
    }

    public function updateDoctorSchedule(DoctorScheduleUpdateRequest $request, UpdateDoctorSchedule $doctorSchedule, string $id): JsonResponse
    {
        $validated = $request->validated();
        $result = $doctorSchedule($validated, $id);

        return response()->json($result);
    }

    public function deleteDoctorSchedule(string $id, DeleteDoctorSchedule $deleteDoctorSchedule): JsonResponse
    {
        $result = $deleteDoctorSchedule($id);

        return response()->json($result);
    }

    public function getDoctorSchedules(Request $request, GetAllDoctorSchedulesFilter $allDoctorSchedulesFilter): JsonResponse
    {
        $filters = $request->only(['branch_id', 'doctor_id', 'date', 'areas_of_specialization']);

        $result = $allDoctorSchedulesFilter($filters);

        return response()->json($result);
    }

    public function checkDoctorAvailability(DoctorAvailabilityRequest $request, CheckDoctorAvailability $checkDoctorAvailability): JsonResponse
    {
        $validatedDoctorAvailability = $request->validated();

        if ($validatedDoctorAvailability) {
            return response()->json($checkDoctorAvailability($validatedDoctorAvailability));
        }

        return response()->json();
    }

    public function getDoctorSchedule(Request $request, GetDoctorScheduleByBranch $getDoctorScheduleByBranch): JsonResponse
    {
        return response()->json($getDoctorScheduleByBranch($request));
    }

    public function getDoctorScheduleById($doctor_id, GetDoctorSchedulesByDoctorId $getDoctorSchedulesByDoctorId): JsonResponse
    {
        return response()->json($getDoctorSchedulesByDoctorId($doctor_id));
    }

    public function getDoctorScheduleWithId(Request $request, GetDoctorSchedulesByDoctorId $getDoctorSchedulesByDoctorId): JsonResponse
    {
        $doctor_id = $request->get('doctor_id');
        if (! $doctor_id) {
            return response()->json(CommonResponse::sendBadRequestResponse('doctor'));
        }

        return response()->json($getDoctorSchedulesByDoctorId($doctor_id));
    }

    /**
     * Get all schedule requests for a doctor (pending, approved, rejected)
     */
    public function getDoctorScheduleRequests(string $doctor_id, GetDoctorScheduleRequests $getDoctorScheduleRequests): JsonResponse
    {
        return response()->json($getDoctorScheduleRequests($doctor_id));
    }

    /**
     * Get a single schedule request by ID
     */
    public function getScheduleRequestById(string $id): JsonResponse
    {
        try {
            $request = \App\Models\ApprovalRequest::where('id', $id)
                ->where('entity_type', 'doctor_schedule')
                ->first();

            if (!$request) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Schedule request not found'
                ]);
            }

            $requestData = $request->request_data;
            $branch = \App\Models\Branch::find($requestData['branch_id'] ?? null);

            return response()->json([
                'status' => 200,
                'request' => [
                    'id' => $request->id,
                    'doctor_id' => $requestData['doctor_id'] ?? null,
                    'branch_id' => $requestData['branch_id'] ?? null,
                    'branch_name' => $branch?->center_name ?? 'Unknown Branch',
                    'schedule_day' => $requestData['schedule_day'] ?? '',
                    'start_time' => $requestData['start_time'] ?? '',
                    'end_time' => $requestData['end_time'] ?? '',
                    'max_patients' => $requestData['max_patients'] ?? 0,
                    'time_per_patient' => $requestData['time_per_patient'] ?? 15,
                    'status' => $request->status,
                    'reason' => $request->reason,
                    'approval_notes' => $request->approval_notes,
                    'requested_at' => $request->requested_at,
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('getScheduleRequestById Error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch schedule request'
            ]);
        }
    }

    /**
     * Update a pending schedule request
     */
    public function updateDoctorScheduleRequest(DoctorScheduleCreateRequest $request, string $id, UpdateDoctorScheduleRequest $updateRequest): JsonResponse
    {
        $validated = $request->validated();
        return response()->json($updateRequest($validated, $id));
    }

    /**
     * Cancel/withdraw a pending schedule request
     */
    public function cancelDoctorScheduleRequest(string $doctor_id, string $id, CancelDoctorScheduleRequest $cancelRequest): JsonResponse
    {
        return response()->json($cancelRequest($doctor_id, $id));
    }
}
