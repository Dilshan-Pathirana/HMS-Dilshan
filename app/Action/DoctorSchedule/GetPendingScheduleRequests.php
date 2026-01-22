<?php

namespace App\Action\DoctorSchedule;

use App\Models\ApprovalRequest;
use App\Models\AllUsers\User;
use App\Models\Branch;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;

class GetPendingScheduleRequests
{
    public function __invoke(?string $branchId = null): array
    {
        try {
            $query = ApprovalRequest::where('entity_type', 'doctor_schedule')
                ->where('status', 'pending')
                ->with(['requester' => function($q) {
                    $q->select('id', 'first_name', 'last_name', 'email');
                }])
                ->orderBy('requested_at', 'desc');
            
            // If branch ID is provided, filter by branch (using LIKE for cross-database compatibility)
            if ($branchId) {
                $query->where('request_data', 'LIKE', '%"branch_id":"' . $branchId . '"%');
            }
            
            $requests = $query->get();
            
            // Enrich the data with branch information
            $enrichedRequests = $requests->map(function($request) {
                $requestData = $request->request_data;
                $branch = Branch::find($requestData['branch_id'] ?? null);
                
                return [
                    'id' => $request->id,
                    'doctor_id' => $requestData['doctor_id'] ?? null,
                    'doctor_name' => $request->requester 
                        ? trim($request->requester->first_name . ' ' . $request->requester->last_name)
                        : 'Unknown',
                    'doctor_email' => $request->requester?->email ?? '',
                    'branch_id' => $requestData['branch_id'] ?? null,
                    'branch_name' => $branch?->center_name ?? 'Unknown Branch',
                    'schedule_day' => $requestData['schedule_day'] ?? '',
                    'start_time' => $requestData['start_time'] ?? '',
                    'end_time' => $requestData['end_time'] ?? '',
                    'max_patients' => $requestData['max_patients'] ?? 0,
                    'time_per_patient' => $requestData['time_per_patient'] ?? 15,
                    'reason' => $request->reason,
                    'requested_at' => $request->requested_at?->format('Y-m-d H:i:s') ?? $request->created_at->format('Y-m-d H:i:s'),
                    'status' => $request->status,
                ];
            });
            
            return [
                'status' => 200,
                'message' => 'Pending schedule requests retrieved successfully',
                'requests' => $enrichedRequests
            ];
        } catch (\Exception $e) {
            Log::error('Get Pending Schedule Requests Error: ' . $e->getMessage());
            
            return CommonResponse::sendBadResponse();
        }
    }
}
