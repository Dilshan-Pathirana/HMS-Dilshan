<?php

namespace App\Action\DoctorSchedule;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorSchedule\DoctorSchedule;

class CreateDoctorSchedule
{
    public function __invoke(array $validated): array
    {
        DB::beginTransaction();
        try {
            DoctorSchedule::create([
                 'doctor_id' => $validated['doctor_id'],
                 'branch_id' => $validated['branch_id'],
                 'schedule_day' => $validated['schedule_day'],
                 'start_time' => $validated['start_time'],
                 'max_patients' => $validated['max_patients'],
             ]);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Doctor Schedule created successfully');
        } catch (\Exception $e) {
            Log::error('DoctorSchedule Error: '.$e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
