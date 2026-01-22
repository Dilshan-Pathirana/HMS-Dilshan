<?php

namespace App\Action\User\Patient;

use App\Models\AllUsers\Patient;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetUserIdToPatientDetails
{
    public function __invoke(string $userId): array
    {
        try {
            $patient = Patient::where('user_id', $userId)->first();

            if (! $patient) {
                return CommonResponse::sendBadResponseWithMessage('No patient found for this user_id.');
            }

            $patientDetails = [
                'id' => $patient->user_id,
                'branch_id' => $patient->branch_id,
                'patient_id' => $patient->patient_id,
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'phone' => $patient->phone,
                'NIC' => $patient->NIC,
                'email' => $patient->email,
                'address' => $patient->address,
                'city' => $patient->city,
                'date_of_birth' => $patient->date_of_birth ? $patient->date_of_birth->format('Y-m-d') : null,
                'gender' => $patient->gender,
                'blood_type' => $patient->blood_type,
                'emergency_contact_name' => $patient->emergency_contact_name,
                'emergency_contact_phone' => $patient->emergency_contact_phone,
            ];

            return CommonResponse::sendSuccessResponseWithData('data', (object) $patientDetails);
        } catch (\Exception $exception) {
            DB::rollBack();

            return CommonResponse::sendBadResponseWithMessage('Internal Server Error: '.$exception->getMessage());
        }
    }
}
