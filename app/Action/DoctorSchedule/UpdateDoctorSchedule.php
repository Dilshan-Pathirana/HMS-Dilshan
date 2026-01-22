<?php

namespace App\Action\DoctorSchedule;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorSchedule\DoctorSchedule;

class UpdateDoctorSchedule
{
    public function __invoke(array $data, string $id): array
    {
        DB::beginTransaction();

        try {
            $doctorSchedule = DoctorSchedule::findOrFail($id);

            $doctorSchedule->update([
                'doctor_id' => $data['doctor_id'],
                'branch_id' => $data['branch_id'],
                'schedule_day' => $data['schedule_day'],
                'start_time' => $data['start_time'],
                'max_patients' => $data['max_patients'],
            ]);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Doctor Schedule updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('UpdateDoctorSchedule Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
