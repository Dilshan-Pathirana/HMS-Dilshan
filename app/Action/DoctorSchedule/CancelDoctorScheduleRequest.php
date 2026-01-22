<?php

namespace App\Action\DoctorSchedule;

use App\Models\ApprovalRequest;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CancelDoctorScheduleRequest
{
    /**
     * Cancel/withdraw a pending schedule request
     */
    public function __invoke(string $doctorId, string $requestId): array
    {
        DB::beginTransaction();
        try {
            $approvalRequest = ApprovalRequest::find($requestId);

            if (!$approvalRequest) {
                DB::rollBack();
                return CommonResponse::sendBadRequestResponse('Schedule request not found');
            }

            if ($approvalRequest->status !== 'pending') {
                DB::rollBack();
                return [
                    'status' => 400,
                    'message' => 'Cannot cancel a schedule request that has already been ' . $approvalRequest->status
                ];
            }

            // Verify the doctor owns this request
            if ($approvalRequest->requested_by != $doctorId) {
                DB::rollBack();
                return [
                    'status' => 403,
                    'message' => 'You are not authorized to cancel this schedule request'
                ];
            }

            // Delete the pending request
            $approvalRequest->delete();

            DB::commit();

            return [
                'status' => 200,
                'message' => 'Schedule request cancelled successfully'
            ];
        } catch (\Exception $e) {
            Log::error('CancelDoctorScheduleRequest Error: ' . $e->getMessage());
            DB::rollBack();
            return CommonResponse::sendBadResponse();
        }
    }
}
