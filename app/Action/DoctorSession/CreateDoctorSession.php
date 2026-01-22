<?php

namespace App\Action\DoctorSession;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorSession\DoctorSession;

class CreateDoctorSession
{
    public function __invoke(array $data): array
    {
        try {
            DoctorSession::create([
                'branch_id' => $data['branch_id'],
                'doctor_id' => $data['doctor_id'],
                'patient_id' => $data['patient_id'],
            ]);

            return CommonResponse::sendSuccessResponse('Doctor session created successfully');
        } catch (Exception $e) {
            Log::error('Failed to create doctor session: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return CommonResponse::sendBadResponseWithMessage('Failed to create doctor session');
        }
    }
}
