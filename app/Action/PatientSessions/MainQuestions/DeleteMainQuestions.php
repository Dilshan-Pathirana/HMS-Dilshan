<?php

namespace App\Action\PatientSessions\MainQuestions;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\PatientSession\MainQuestions;
use App\Models\PatientSession\QuestionAnswer;

class DeleteMainQuestions
{
    public function __invoke(string $id): array
    {
        try {
            $mainQuestion = MainQuestions::find($id);

            if (! $mainQuestion) {
                return CommonResponse::sendBadResponseWithMessage('Main question not found');
            }

            QuestionAnswer::where('question_id', $mainQuestion->id)->delete();

            $mainQuestion->delete();

            return CommonResponse::sendSuccessResponse('Main question and related answers deleted successfully');
        } catch (Exception $e) {
            Log::error('Error deleting main question: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('Failed to delete main question');
        }
    }
}
