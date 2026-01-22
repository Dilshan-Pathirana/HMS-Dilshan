<?php

namespace App\Action\DoctorSchedule;

use App\Models\ApprovalRequest;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateDoctorScheduleRequest
{
    /**
     * Update a pending schedule request (only if status is still pending)
     */
    public function __invoke(array $validated, string $requestId): array
    {
        DB::beginTransaction();
        try {
            $approvalRequest = ApprovalRequest::find($requestId);

            if (!$approvalRequest) {
                DB::rollBack();
                return CommonResponse::sendBadRequestResponse('Schedule request not found');
            }

            // Allow editing for both 'pending' and 'revision_requested' statuses
            if (!in_array($approvalRequest->status, ['pending', 'revision_requested'])) {
                DB::rollBack();
                return [
                    'status' => 400,
                    'message' => 'Cannot edit a schedule request that has already been ' . $approvalRequest->status
                ];
            }

            // Verify the doctor owns this request
            if ($approvalRequest->requested_by != $validated['doctor_id']) {
                DB::rollBack();
                return [
                    'status' => 403,
                    'message' => 'You are not authorized to edit this schedule request'
                ];
            }

            // Check for conflicts with the updated data
            $conflictChecker = new RequestDoctorScheduleApproval();
            $conflicts = $conflictChecker->checkForConflictsPublic($validated, $requestId);

            if (!empty($conflicts)) {
                DB::rollBack();
                return [
                    'status' => 409,
                    'message' => 'Schedule conflict detected',
                    'conflicts' => $conflicts,
                    'warning' => true
                ];
            }

            // Update the request data and reset status to pending
            $approvalRequest->update([
                'request_data' => [
                    'doctor_id' => $validated['doctor_id'],
                    'branch_id' => $validated['branch_id'],
                    'schedule_day' => $validated['schedule_day'],
                    'start_time' => $validated['start_time'],
                    'end_time' => $validated['end_time'] ?? null,
                    'max_patients' => $validated['max_patients'],
                    'time_per_patient' => $validated['time_per_patient'] ?? 15,
                ],
                'status' => 'pending', // Reset to pending for re-review
                'reason' => 'Doctor schedule creation request (revised)',
                'requested_at' => now(),
                'approved_by' => null,
                'approval_notes' => null,
                'approved_at' => null,
            ]);

            DB::commit();

            return [
                'status' => 200,
                'message' => 'Schedule request updated successfully. Awaiting branch manager approval.',
                'approval_request_id' => $approvalRequest->id
            ];
        } catch (\Exception $e) {
            Log::error('UpdateDoctorScheduleRequest Error: ' . $e->getMessage());
            DB::rollBack();
            return CommonResponse::sendBadResponse();
        }
    }
}
