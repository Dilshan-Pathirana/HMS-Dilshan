<?php

namespace App\Action\DoctorDisease;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorCreatedDisease\DoctorCreatedDisease;

class CreateDoctorCreatedDisease
{
    public function __invoke(array $data): array
    {
        try {
            DoctorCreatedDisease::create([
                'doctor_id'    => $data['doctor_id'],
                'disease_name' => $data['disease_name'],
                'description'  => $data['description'],
                'priority'     => $data['priority'],
            ]);

            return CommonResponse::sendSuccessResponse('Disease created successfully');
        } catch (Exception $e) {
            Log::error('Failed to create disease: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return CommonResponse::sendBadResponseWithMessage('Failed to create disease');
        }
    }
}
