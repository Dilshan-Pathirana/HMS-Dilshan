<?php

namespace App\Action\DoctorDisease;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllDoctorDisease
{
    public function __invoke(?string $doctorId = null): array
    {
        try {
            $query = DB::table('doctor_created_diseases')
                ->join('users', 'doctor_created_diseases.doctor_id', '=', 'users.id')
                ->select(
                    'doctor_created_diseases.id',
                    'doctor_created_diseases.doctor_id',
                    'users.first_name AS doctor_first_name',
                    'users.last_name AS doctor_last_name',
                    'doctor_created_diseases.disease_name',
                    'doctor_created_diseases.description',
                    'doctor_created_diseases.priority',
                );

            if ($doctorId) {
                $query->where('doctor_created_diseases.doctor_id', $doctorId);
            }

            $diseases = $query->get();

            return CommonResponse::sendSuccessResponseWithData('doctor_diseases', $diseases);
        } catch (\Exception $e) {
            Log::error('Error fetching doctor diseases: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
