<?php

namespace App\Action\PatientAppointment;

use App\Services\SmsSender;
use App\Helpers\SmsTemplates;
use App\Models\AllUsers\User;
use App\Models\Hospital\Branch;
use App\Models\AllUsers\Patient;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorSchedule\DoctorSchedule;
use App\Models\Appointment\PatientAppointment;

class SendAppointmentSms
{
    public function __invoke(PatientAppointment $appointment): bool
    {
        try {
            $patient = Patient::where('user_id', $appointment->user_id)->first();
            if (! $patient) {
                Log::warning('Patient not found for SMS notification', [
                    'appointment_id' => $appointment->id,
                    'user_id' => $appointment->user_id,
                ]);

                return false;
            }

            $patientUser = User::find($appointment->user_id);
            if (! $patientUser) {
                Log::warning('Patient user not found for SMS notification', [
                    'appointment_id' => $appointment->id,
                    'user_id' => $appointment->user_id,
                ]);

                return false;
            }

            $doctorUser = User::find($appointment->doctor_id);
            if (! $doctorUser) {
                Log::warning('Doctor user not found for SMS notification', [
                    'appointment_id' => $appointment->id,
                    'doctor_id' => $appointment->doctor_id,
                ]);

                return false;
            }

            $doctorSchedule = DoctorSchedule::find($appointment->schedule_id);

            if (! $doctorSchedule) {
                Log::warning('Doctor schedule not found for SMS notification', [
                    'appointment_id' => $appointment->id,
                    'schedule_id' => $appointment->schedule_id,
                ]);

                return false;
            }

            $branch = Branch::find($appointment->branch_id);
            $branchName = $branch ? $branch->center_name : 'CURE HEALTH Center';

            $appointmentTime = SmsTemplates::calculateAppointmentTime(
                $doctorSchedule->start_time,
                $appointment->slot
            );

            $appointmentDate = SmsTemplates::formatDate($appointment->date);

            $message = SmsTemplates::adminAppointmentConfirmation(
                $patientUser->first_name,
                $patientUser->last_name,
                $doctorUser->first_name,
                $doctorUser->last_name,
                $appointmentDate,
                $appointmentTime,
                $branchName,
                $appointment->slot
            );

            $smsSent = SmsSender::sendSMS($patient->phone, $message);

            if ($smsSent) {
                Log::info('SMS notification sent successfully for admin appointment', [
                    'appointment_id' => $appointment->id,
                    'patient_phone' => $patient->phone,
                    'message_length' => strlen($message),
                ]);
            } else {
                Log::error('Failed to send SMS notification for admin appointment', [
                    'appointment_id' => $appointment->id,
                    'patient_phone' => $patient->phone,
                ]);
            }

            return $smsSent;
        } catch (\Exception $exception) {
            Log::error('Exception occurred while sending appointment SMS', [
                'appointment_id' => $appointment->id,
                'error' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);

            return false;
        }
    }
}
