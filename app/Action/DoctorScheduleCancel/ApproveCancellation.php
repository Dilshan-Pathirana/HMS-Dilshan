<?php

namespace App\Action\DoctorScheduleCancel;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Appointment\PatientAppointment;
use App\Models\Appointment\DoctorScheduleCancellation;

class ApproveCancellation
{
    public function __invoke(string $cancellationId): array
    {
        try {
            return DB::transaction(function () use ($cancellationId) {
                $cancellation = DoctorScheduleCancellation::find($cancellationId);

                if (! $cancellation) {
                    return CommonResponse::sendBadResponseWithMessage('Schedule cancellation request not found.');
                }

                if ($cancellation->status !== 0) {
                    return CommonResponse::sendBadResponseWithMessage('This cancellation request has already been processed.');
                }

                $appointmentsCancelled = $this->cancelRelatedAppointments($cancellation);

                $cancellation->update([
                    'status' => 1,
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                ]);

                $message = $appointmentsCancelled > 0
                    ? "Schedule cancellation request approved successfully. {$appointmentsCancelled} appointments have been cancelled."
                    : 'Schedule cancellation request approved successfully. No active appointments were found to cancel.';

                return CommonResponse::sendSuccessResponse($message);
            });
        } catch (\Exception $e) {
            Log::error('ApproveCancellationError: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }

    private function cancelRelatedAppointments(DoctorScheduleCancellation $cancellation): int
    {
        try {
            $appointments = PatientAppointment::where('doctor_id', $cancellation->doctor_id)
                ->where('branch_id', $cancellation->branch_id)
                ->where('schedule_id', $cancellation->schedule_id)
                ->where('date', $cancellation->date)
                ->where('status', 1)
                ->get();

            if ($appointments->isEmpty()) {
                return 0;
            }

            $appointmentIds = $appointments->pluck('id')->toArray();

            $updatedCount = PatientAppointment::whereIn('id', $appointmentIds)
                ->update(['status' => 0]);

            return $updatedCount;
        } catch (\Exception $e) {
            Log::error('CancelRelatedAppointmentsError: '.$e->getMessage());
            throw $e;
        }
    }
}
