<?php

namespace App\Action\DoctorAppointment;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllAppointmentsFilter
{
    public function __invoke(array $filters = []): array
    {
        try {
            $query = DB::table('appointment_bookings')
                ->join('patients', 'appointment_bookings.patient_id', '=', 'patients.user_id')
                ->join('doctors', 'appointment_bookings.doctor_id', '=', 'doctors.user_id')
                ->join('users', 'appointment_bookings.doctor_id', '=', 'users.id')
                ->join('branches', 'appointment_bookings.branch_id', '=', 'branches.id')
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

            if (! empty($filters['branch_id'])) {
                $query->where('appointment_bookings.branch_id', $filters['branch_id']);
            }

            if (! empty($filters['doctor_id'])) {
                $query->where('appointment_bookings.doctor_id', $filters['doctor_id']);
            }

            if (! empty($filters['date'])) {
                $query->where('appointment_bookings.appointment_date', $filters['date']);
            }

            if (! empty($filters['patient_name'])) {
                $query->whereRaw("CONCAT(patients.first_name, ' ', patients.last_name) LIKE ?", ["%{$filters['patient_name']}%"]);
            }

            $doctorAppointments = $query->get();

            if ($doctorAppointments->isEmpty()) {
                return CommonResponse::getNotFoundResponse('appointments');
            }

            return CommonResponse::sendSuccessResponseWithData('appointments', $doctorAppointments);
        } catch (\Exception $e) {
            Log::error('appointments Error: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('Failed to retrieve doctorAppointments.');
        }
    }
}
