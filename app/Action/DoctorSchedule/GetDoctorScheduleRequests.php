<?php

namespace App\Action\DoctorSchedule;

use App\Models\ApprovalRequest;
use App\Models\Branch;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;

class GetDoctorScheduleRequests
{
    /**
     * Get pending, approved, and rejected schedule requests for a doctor
     */
    public function __invoke(string $doctorId): array
    {
        try {
            $requests = ApprovalRequest::where('requested_by', $doctorId)
                ->where('entity_type', 'doctor_schedule')
                ->orderBy('requested_at', 'desc')
                ->get()
                ->map(function ($request) {
                    $requestData = is_array($request->request_data) 
                        ? $request->request_data 
                        : json_decode($request->request_data, true);
                    
                    $branch = Branch::find($requestData['branch_id'] ?? null);
                    
                    return [
                        'id' => $request->id,
                        'status' => $request->status,
                        'branch_id' => $requestData['branch_id'] ?? null,
                        'branch_name' => $branch ? $branch->center_name : 'Unknown Branch',
                        'schedule_day' => $requestData['schedule_day'] ?? null,
                        'start_time' => $requestData['start_time'] ?? null,
                        'end_time' => $requestData['end_time'] ?? null,
                        'max_patients' => $requestData['max_patients'] ?? null,
                        'time_per_patient' => $requestData['time_per_patient'] ?? 15,
                        'reason' => $request->reason,
                        'approval_notes' => $request->approval_notes,
                        'requested_at' => $request->requested_at,
                        'approved_at' => $request->approved_at,
                    ];
                });

            return [
                'status' => 200,
                'scheduleRequests' => $requests->toArray(),
                'pending' => $requests->where('status', 'pending')->values()->toArray(),
                'approved' => $requests->where('status', 'approved')->values()->toArray(),
                'rejected' => $requests->where('status', 'rejected')->values()->toArray(),
            ];
        } catch (\Exception $e) {
            Log::error('GetDoctorScheduleRequests Error: ' . $e->getMessage());
            return CommonResponse::sendBadResponse();
        }
    }
}
