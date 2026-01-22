<?php

namespace App\Action\PatientAppointment;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllPatientAppointment
{
    public function __invoke(): array
    {
        try {
            $query = DB::table('appointment_bookings')
                ->leftJoin('patients', 'appointment_bookings.patient_id', '=', 'patients.user_id')
                ->leftJoin('doctors', 'appointment_bookings.doctor_id', '=', 'doctors.user_id')
                ->leftJoin('users', 'doctors.user_id', '=', 'users.id')
                ->leftJoin('branches', 'appointment_bookings.branch_id', '=', 'branches.id')
                ->select(
                    'appointment_bookings.id',
                    'appointment_bookings.patient_id as user_id',
                    'appointment_bookings.doctor_id',
                    'appointment_bookings.appointment_date as date',
                    'appointment_bookings.slot_number as slot',
                    'appointment_bookings.status',
                    'appointment_bookings.payment_status',
                    'patients.first_name AS patient_first_name',
                    'patients.last_name AS patient_last_name',
                    'patients.phone',
                    'patients.NIC',
                    'patients.email',
                    'patients.address',
                    'doctors.areas_of_specialization',
                    'users.first_name AS doctor_first_name',
                    'users.last_name AS doctor_last_name',
                    'branches.center_name'
                )
                ->whereNotIn('appointment_bookings.status', ['cancelled']);

            $appointments = $query->get();

            if ($appointments->isEmpty()) {
                return CommonResponse::sendBadResponseWithMessage('No appointments found.');
            }

            return CommonResponse::sendSuccessResponseWithData('appointments', $appointments);
        } catch (\Exception $e) {
            Log::error('GetPatientAppointmentError: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
