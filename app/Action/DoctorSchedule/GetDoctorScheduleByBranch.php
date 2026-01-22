<?php

namespace App\Action\DoctorSchedule;

use Illuminate\Http\Request;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetDoctorScheduleByBranch
{
    public function __invoke(Request $request): array
    {
        $doctorId = $request->input('doctor_id');
        $branchId = $request->input('branch_id');

        $schedule = DB::transaction(function () use ($doctorId, $branchId) {
            return DB::table('doctor_schedules')
                ->where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->select('schedule_day', 'start_time', 'max_patients')
                ->first();
        });

        return CommonResponse::sendSuccessResponseWithData('doctor_schedule', $schedule);
    }
}
