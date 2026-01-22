<?php

namespace App\Action\DoctorSchedule;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllDoctorSchedule
{
    public function __invoke(): array
    {
        try {
            $doctorSchedule = DB::table('doctor_schedules')
                ->join('users', 'doctor_schedules.doctor_id', '=', 'users.id')
                ->join('branches', 'doctor_schedules.branch_id', '=', 'branches.id')
                ->select(
                    'doctor_schedules.id',
                    'doctor_schedules.doctor_id',
                    'users.first_name as user_first_name',
                    'users.last_name as user_last_name',
                    'doctor_schedules.branch_id',
                    'branches.center_name as branch_center_name',
                    'doctor_schedules.schedule_day',
                    'doctor_schedules.start_time',
                    'doctor_schedules.max_patients',
                )
                ->get();

            if ($doctorSchedule->isEmpty()) {
                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponseWithData('doctorSchedule', $doctorSchedule);
        } catch (\Exception $e) {
            Log::error('GetDoctorScheduleError: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
