<?php

namespace App\Action\DoctorSchedule;

use App\Models\ApprovalRequest;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorSchedule\DoctorSchedule;

class ApproveDoctorScheduleRequest
{
    public function __invoke(string $requestId, string $approverId, string $action, ?string $notes = null): array
    {
        DB::beginTransaction();
        try {
            $approvalRequest = ApprovalRequest::find($requestId);
            
            if (!$approvalRequest) {
                DB::rollBack();
                return [
                    'status' => 404,
                    'message' => 'Approval request not found'
                ];
            }
            
            if ($approvalRequest->status !== 'pending') {
                DB::rollBack();
                return [
                    'status' => 400,
                    'message' => 'This request has already been processed'
                ];
            }
            
            if ($action === 'approve') {
                // Create the actual schedule
                $requestData = $approvalRequest->request_data;
                
                DoctorSchedule::create([
                    'doctor_id' => $requestData['doctor_id'],
                    'branch_id' => $requestData['branch_id'],
                    'schedule_day' => $requestData['schedule_day'],
                    'start_time' => $requestData['start_time'],
                    'end_time' => $requestData['end_time'] ?? null,
                    'max_patients' => $requestData['max_patients'],
                    'time_per_patient' => $requestData['time_per_patient'] ?? 15,
                    'status' => 'active',
                ]);
                
                $approvalRequest->update([
                    'status' => 'approved',
                    'approved_by' => $approverId,
                    'approval_notes' => $notes,
                    'approved_at' => now(),
                ]);
                
                DB::commit();
                
                return [
                    'status' => 200,
                    'message' => 'Schedule request approved and schedule created successfully'
                ];
            } elseif ($action === 'reject') {
                $approvalRequest->update([
                    'status' => 'rejected',
                    'approved_by' => $approverId,
                    'approval_notes' => $notes,
                    'approved_at' => now(),
                ]);
                
                DB::commit();
                
                return [
                    'status' => 200,
                    'message' => 'Schedule request rejected'
                ];
            } elseif ($action === 'revision_requested') {
                $approvalRequest->update([
                    'status' => 'revision_requested',
                    'approved_by' => $approverId,
                    'approval_notes' => $notes,
                    'approved_at' => null, // Not yet approved, just sent back for revision
                ]);
                
                DB::commit();
                
                return [
                    'status' => 200,
                    'message' => 'Request sent back to doctor for revision'
                ];
            } else {
                DB::rollBack();
                return [
                    'status' => 400,
                    'message' => 'Invalid action. Use "approve", "reject", or "revision_requested"'
                ];
            }
        } catch (\Exception $e) {
            Log::error('Schedule Approval Error: ' . $e->getMessage());
            DB::rollBack();
            
            return CommonResponse::sendBadResponse();
        }
    }
}
