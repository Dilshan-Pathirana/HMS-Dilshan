<?php

namespace App\Action\DoctorSchedule;

use Illuminate\Http\Request;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetDoctorScheduleDoctorID
{
    public function __invoke(Request $request): array
    {
        $doctorId = $request->input('doctor_id');

        $schedules = DB::transaction(function () use ($doctorId) {
            return DB::table('doctor_schedules')
                ->where('doctor_id', $doctorId)
                ->select('schedule_day', 'start_time', 'max_patients', 'branch_id')
                ->get();
        });

        return CommonResponse::sendSuccessResponseWithData('doctor_schedules', $schedules);
    }
}
