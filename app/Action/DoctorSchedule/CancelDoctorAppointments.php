<?php

namespace App\Action\DoctorSchedule;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\Appointment\PatientAppointment;

class CancelDoctorAppointments
{
    public function __invoke(array $validatedDoctorScheduleCancellation): array
    {
        [$user_id, $branch_id, $schedule_id, $date] = $validatedDoctorScheduleCancellation;

        try {
            $appointments = $this->getAppointments($user_id, $branch_id, $schedule_id, $date);

            if ($appointments->isEmpty()) {
                return CommonResponse::sendBadResponseWithMessage('No active appointments found to cancel for the specified date.');
            }

            $appointments->update(['status' => 0]);

            return CommonResponse::sendSuccessResponse('Appointments cancelled successfully.');
        } catch (\Exception $e) {
            Log::error('CancelAppointmentsError: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }

    private function getAppointments(string $user_id, string $branch_id, string $schedule_id, string $date)
    {
        return PatientAppointment::where('doctor_id', $user_id)
            ->where('branch_id', $branch_id)
            ->where('schedule_id', $schedule_id)
            ->where('date', $date)
            ->where('status', 1)
            ->get();
    }
}
