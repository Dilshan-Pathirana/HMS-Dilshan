<?php

namespace App\Action\PatientSessions\MainQuestions;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllMainQuestions
{
    public function __invoke(?string $doctorId = null): array
    {
        try {
            $query = DB::table('main_question')
                ->join('users', 'main_question.doctor_id', '=', 'users.id')
                ->select(
                    'main_question.id',
                    'main_question.doctor_id',
                    'users.first_name AS doctor_first_name',
                    'users.last_name AS doctor_last_name',
                    'main_question.question',
                    'main_question.description',
                    'main_question.order',
                    'main_question.status'
                );

            if ($doctorId) {
                $query->where('main_question.doctor_id', $doctorId);
            }

            $mainQuestions = $query->get();

            return CommonResponse::sendSuccessResponseWithData('doctor_questions', $mainQuestions);
        } catch (\Exception $e) {
            Log::error('Error fetching main questions: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
