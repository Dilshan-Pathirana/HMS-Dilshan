<?php

namespace App\Action\PatientAppointment;

use Carbon\Carbon;
use App\Response\CommonResponse;
use App\Models\Appointment\PatientAppointment;

class PatientAppointmentChange
{
    public function __invoke(string $patientUserId, array $appointmentUpdateDetails): array
    {
        $patientUserExistingAppointment = PatientAppointment::findPatientAppointment(
            $patientUserId,
            $appointmentUpdateDetails['date'],
            $appointmentUpdateDetails['existing_slot'],
            $appointmentUpdateDetails['doctor_id'],
            $appointmentUpdateDetails['schedule_id']
        );

        if ($this->isRescheduleDateValid($patientUserExistingAppointment)) {
            return CommonResponse::sendSuccessResponse('The new date must be in the current 2 day range.');
        }

        if ($this->hasExceededRescheduleLimit($patientUserExistingAppointment)) {
            return CommonResponse::sendBadResponseWithMessage('You have already rescheduled this appointment once. No further changes are allowed.');
        }

        $patientUserExistingAppointment->date = $appointmentUpdateDetails['new_date'];
        $patientUserExistingAppointment->slot = $appointmentUpdateDetails['new_slot'];
        $patientUserExistingAppointment->branch_id = $appointmentUpdateDetails['new_branch_id'];
        $patientUserExistingAppointment->reschedule_count = $patientUserExistingAppointment->reschedule_count + 1;
        $patientUserExistingAppointment->save();

        return CommonResponse::sendSuccessResponse('Change Appointment Date Successfully.');
    }

    private function isRescheduleDateValid(PatientAppointment $patientUserExistingAppointment): bool
    {
        $appointmentDate = Carbon::parse($patientUserExistingAppointment->date);
        $today = Carbon::today();

        return $today->diffInDays($appointmentDate) == 2;
    }

    private function hasExceededRescheduleLimit(PatientAppointment $patientUserExistingAppointment): bool
    {
        return $patientUserExistingAppointment->reschedule_count >= 1;
    }
}
