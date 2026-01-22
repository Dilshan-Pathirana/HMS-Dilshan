<?php

namespace App\Action\PatientAppointment;

use Exception;
use Carbon\Carbon;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\Appointment\PatientAppointment;
use Symfony\Component\HttpFoundation\Response;

class CreateAdminPatientAppointment
{
    use PatientAppointmentBase;

    public function __invoke(array $validated): array
    {
        DB::beginTransaction();

        try {
            $validated = $this->normalizeValidatedData($validated);

            $this->findOrCreatePatient($validated);

            if ($this->checkForExistingAppointment($validated)) {
                return CommonResponse::sendBadResponseWithMessage('Appointment already exists for this user at the specified date and time.');
            }

            $appointment = PatientAppointment::create([
                'schedule_id' => $validated['schedule_id'],
                'user_id' => $this->userId,
                'doctor_id' => $validated['doctor_id'],
                'branch_id' => $validated['branch_id'],
                'date' => $validated['date'],
                'slot' => $validated['slot'],
                'status' => 1,
                'payment_status' => 'paid',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            $sendSms = new SendAppointmentSms();
            $smsResult = $sendSms($appointment);

            DB::commit();

            return [
                'status' => Response::HTTP_OK,
                'message' => 'Patient appointment created successfully by admin.',
                'data' => [
                    'appointment_id' => $appointment->id,
                    'user_id' => $this->userId,
                    'date' => $validated['date'],
                    'slot' => $validated['slot'],
                    'status' => $appointment->status,
                    'sms_sent' => $smsResult,
                ],
            ];
        } catch (Exception $exception) {
            DB::rollBack();

            return CommonResponse::sendBadResponseWithMessage('Internal Server Error: '.$exception->getMessage());
        }
    }
}
