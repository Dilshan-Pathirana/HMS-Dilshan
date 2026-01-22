<?php

namespace App\Action\DoctorSchedule;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\Appointment\DoctorScheduleCancellation;

class CancelDoctorSchedule
{
    public function __invoke(array $cancellationData): array
    {
        try {
            $user_id = $cancellationData['doctor_id'];
            $branch_id = $cancellationData['branch_id'];
            $schedule_id = $cancellationData['schedule_id'];
            $date = $cancellationData['date'];
            $reason = $cancellationData['reason'];

            $existingCancellation = $this->checkExistingCancellation($cancellationData);

            if ($existingCancellation) {
                return CommonResponse::sendBadResponseWithMessage('The schedule has already been requested to be canceled.');
            }

            DoctorScheduleCancellation::create([
                'schedule_id' => $schedule_id,
                'doctor_id' => $user_id,
                'branch_id' => $branch_id,
                'date' => $date,
                'reason' => $reason,
            ]);

            return CommonResponse::sendSuccessResponse('Schedule cancellation request sent successfully.');
        } catch (\Exception $e) {
            Log::error('CancelDoctorScheduleError: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('Error cancelling schedule.');
        }
    }

    private function checkExistingCancellation(array $cancellationData)
    {
        return DoctorScheduleCancellation::where('schedule_id', $cancellationData['schedule_id'])
            ->where('doctor_id', $cancellationData['doctor_id'])
            ->where('branch_id', $cancellationData['branch_id'])
            ->where('date', $cancellationData['date'])
            ->first();
    }
}
