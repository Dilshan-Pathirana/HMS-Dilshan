<?php

namespace App\Action\DoctorDisease;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorCreatedDisease\DoctorCreatedDisease;

class UpdateDoctorCreatedDisease
{
    public function __invoke(string $id, array $data): array
    {
        try {
            $disease = DoctorCreatedDisease::find($id);

            if (! $disease) {
                return CommonResponse::sendBadResponseWithMessage('Disease not found');
            }

            $disease->update([
                'doctor_id'    => $data['doctor_id'],
                'disease_name' => $data['disease_name'],
                'description'  => $data['description'],
                'priority'     => $data['priority'],
            ]);

            return CommonResponse::sendSuccessResponse('Disease updated successfully');
        } catch (Exception $e) {
            Log::error('Failed to update doctor disease', [
                'error' => $e->getMessage(),
            ]);

            return CommonResponse::sendBadResponseWithMessage('Failed to update disease');
        }
    }
}
