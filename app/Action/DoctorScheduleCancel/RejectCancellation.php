<?php

namespace App\Action\DoctorScheduleCancel;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\Appointment\DoctorScheduleCancellation;

class RejectCancellation
{
    public function __invoke(string $cancellationId, array $data): array
    {
        try {
            $cancellation = DoctorScheduleCancellation::find($cancellationId);

            if (! $cancellation) {
                return CommonResponse::sendBadResponseWithMessage('Schedule cancellation request not found.');
            }

            if ($cancellation->status !== 0) {
                return CommonResponse::sendBadResponseWithMessage('This cancellation request has already been processed.');
            }

            $cancellation->update([
                'status' => 2,
                'reject_reason' => $data['reject_reason'],
            ]);

            return CommonResponse::sendSuccessResponse('Schedule cancellation request rejected successfully.');
        } catch (\Exception $e) {
            Log::error('RejectCancellationError: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
