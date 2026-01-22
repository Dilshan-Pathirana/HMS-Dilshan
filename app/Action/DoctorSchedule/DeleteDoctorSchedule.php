<?php

namespace App\Action\DoctorSchedule;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorSchedule\DoctorSchedule;

class DeleteDoctorSchedule
{
    public function __invoke(string $id): array
    {
        DB::beginTransaction();

        try {
            $doctorSchedule = DoctorSchedule::findOrFail($id);
            $doctorSchedule->delete();

            DB::commit();

            return CommonResponse::sendSuccessResponse('Doctor Schedule deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeleteDoctorSchedule Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
