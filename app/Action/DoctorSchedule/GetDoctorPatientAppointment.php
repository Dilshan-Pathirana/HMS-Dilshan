<?php

namespace App\Action\DoctorSchedule;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetDoctorPatientAppointment
{
    public function __invoke(string $user_id, string $branch_id, string $schedule_id): array
    {
        try {
            $appointments = DB::table('appointment_bookings')
                ->join('doctor_schedules', function ($join) {
                    $join->on('appointment_bookings.schedule_id', '=', 'doctor_schedules.id');
                })
                ->join('patients', 'appointment_bookings.patient_id', '=', 'patients.user_id')
                ->where('appointment_bookings.schedule_id', $schedule_id)
                ->where('appointment_bookings.doctor_id', $user_id)
                ->where('appointment_bookings.branch_id', $branch_id)
                ->whereNotIn('appointment_bookings.status', ['cancelled'])
                ->select(
                    'appointment_bookings.schedule_id',
                    'appointment_bookings.doctor_id',
                    'appointment_bookings.branch_id',
                    'appointment_bookings.status',
                    'appointment_bookings.payment_status',
                    'appointment_bookings.appointment_date as date',
                    'appointment_bookings.slot_number as patient_selected_slot',
                    'doctor_schedules.max_patients as all_available_slots_for_doctor',
                    'doctor_schedules.schedule_day as schedule_day',
                    'patients.first_name as patient_first_name',
                    'patients.last_name as patient_last_name',
                    'patients.phone as patient_phone'
                )
                ->get();

            if ($appointments->isEmpty()) {
                return CommonResponse::sendBadResponseWithMessage('No appointments found.');
            }

            return CommonResponse::sendSuccessResponseWithData('schedule_appointments', $appointments);
        } catch (\Exception $e) {
            Log::error('GetPatientAppointmentError: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
