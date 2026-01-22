<?php

namespace App\Action\DoctorScheduleCancel;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetDoctorScheduleCancelById
{
    public function __invoke(string $doctorId): array
    {
        try {
            $query = DB::table('doctor_schedule_cancellations')
                ->join('doctors', 'doctor_schedule_cancellations.doctor_id', '=', 'doctors.user_id')
                ->join('users', 'doctors.user_id', '=', 'users.id')
                ->join('branches', 'doctor_schedule_cancellations.branch_id', '=', 'branches.id')
                ->join('doctor_schedules', 'doctor_schedule_cancellations.schedule_id', '=', 'doctor_schedules.id')
                ->where('doctor_schedule_cancellations.doctor_id', $doctorId)
                ->select(
                    'doctor_schedule_cancellations.id',
                    'doctor_schedule_cancellations.schedule_id',
                    'doctor_schedule_cancellations.doctor_id',
                    'doctor_schedule_cancellations.branch_id',
                    'doctor_schedule_cancellations.date',
                    'doctor_schedule_cancellations.reason',
                    'doctor_schedule_cancellations.status',
                    'doctor_schedule_cancellations.reject_reason',
                    'doctor_schedule_cancellations.created_at',
                    'users.first_name AS doctor_first_name',
                    'users.last_name AS doctor_last_name',
                    'branches.center_name',
                    'doctor_schedules.schedule_day',
                    'doctor_schedules.start_time',
                    'doctor_schedules.max_patients'
                )
                ->orderBy('doctor_schedule_cancellations.created_at', 'desc');

            $cancellations = $query->get();

            return CommonResponse::sendSuccessResponseWithData('doctor_schedule_cancellations', $cancellations);
        } catch (\Exception $e) {
            Log::error('GetDoctorScheduleCancelByIdError: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
