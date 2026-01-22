<?php

namespace App\Action\User\Patient;

use App\Models\AllUsers\Patient;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;

class GetPatientByPhone
{
    public function __invoke(string $phone): array
    {
        try {
            $patient = Patient::where('phone', $phone)->first();

            if (! $patient) {
                return [
                    'status' => 404,
                    'message' => 'Patient not found',
                ];
            }

            $patientData = [
                'firstName' => $patient->first_name,
                'lastName' => $patient->last_name,
                'phone' => $patient->phone,
                'nic' => $patient->NIC ?? '',
                'email' => $patient->email,
                'address' => $patient->address ?? '',
            ];

            return [
                'status' => 200,
                'message' => 'Patient found successfully',
                'data' => $patientData,
            ];
        } catch (\Exception $exception) {
            Log::error('Error getting patient by phone: '.$exception->getMessage(), [
                'phone' => $phone,
                'trace' => $exception->getTraceAsString(),
            ]);

            return CommonResponse::sendBadResponseWithMessage('Internal Server Error');
        }
    }
}
