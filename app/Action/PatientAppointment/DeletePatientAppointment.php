<?php

namespace App\Action\PatientAppointment;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Appointment\PatientAppointment;

class DeletePatientAppointment
{
    public function __invoke(string $id): array
    {
        DB::beginTransaction();

        try {
            $doctorSchedule = PatientAppointment::findOrFail($id);
            $doctorSchedule->delete();

            DB::commit();

            return CommonResponse::sendSuccessResponse('Patient Appointment deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeletePatientAppointment Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
