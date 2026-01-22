<?php

namespace App\Action\DoctorSchedule;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllDoctorSchedulesFilter
{
    public function __invoke(array $filters = []): array
    {
        try {
            $query = DB::table('doctor_schedules')
                ->join('users', 'doctor_schedules.doctor_id', '=', 'users.id')
                ->leftJoin('branches', 'doctor_schedules.branch_id', '=', 'branches.id')
                ->leftJoin('doctors', 'doctor_schedules.doctor_id', '=', 'doctors.user_id')
                ->select(
                    'doctor_schedules.id',
                    'doctor_schedules.doctor_id',
                    'users.first_name as user_first_name',
                    'users.last_name as user_last_name',
                    'branches.id as branch_id',
                    'branches.center_name as branch_center_name',
                    'doctors.areas_of_specialization',
                    'doctor_schedules.schedule_day',
                    'doctor_schedules.start_time',
                    'doctor_schedules.max_patients'
                );

            if (! empty($filters['branch_id'])) {
                $query->where('doctor_schedules.branch_id', $filters['branch_id']);
            }

            if (! empty($filters['doctor_id'])) {
                $query->where('doctor_schedules.doctor_id', $filters['doctor_id']);
            }

            if (! empty($filters['date'])) {
                $query->where('doctor_schedules.schedule_day', $filters['date']);
            }

            if (! empty($filters['areas_of_specialization'])) {
                $query->where('doctors.areas_of_specialization', 'LIKE', '%'.$filters['areas_of_specialization'].'%');
            }

            $doctorSchedules = $query->get();

            if ($doctorSchedules->isEmpty()) {
                return CommonResponse::getNotFoundResponse('doctorSchedules');
            }

            return CommonResponse::sendSuccessResponseWithData('doctorSchedules', $doctorSchedules);
        } catch (\Exception $e) {
            Log::error('GetAllDoctorSchedules Error: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('Failed to retrieve doctor schedules.');
        }
    }
}
