<?php

namespace App\Action\DoctorSession;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetDoctorSessionsByDoctor
{
    public function __invoke(string $doctorId): array
    {
        try {
            $sessions = DB::table('doctor_sessions')
                ->join('users as doctor', 'doctor_sessions.doctor_id', '=', 'doctor.id')
                ->join('users as patient', 'doctor_sessions.patient_id', '=', 'patient.id')
                ->join('branches', 'doctor_sessions.branch_id', '=', 'branches.id')
                ->select(
                    'doctor_sessions.id',
                    'doctor_sessions.branch_id',
                    'branches.center_name as branch_center_name',
                    'doctor_sessions.doctor_id',
                    'doctor.first_name as doctor_first_name',
                    'doctor.last_name as doctor_last_name',
                    'doctor_sessions.patient_id',
                    'patient.first_name as patient_first_name',
                    'patient.last_name as patient_last_name'
                )
                ->where('doctor_sessions.doctor_id', $doctorId)
                ->get();

            return CommonResponse::sendSuccessResponseWithData('doctor_sessions', $sessions);
        } catch (Exception $e) {
            Log::error('Error fetching doctor sessions: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
