<?php

namespace App\Action\QuestionAnswers;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\PatientSession\QuestionAnswer;

class DeleteQuestionAnswer
{
    public function __invoke(string $id): array
    {
        try {
            $answer = QuestionAnswer::find($id);

            if (! $answer) {
                return CommonResponse::sendBadResponseWithMessage('Answer not found');
            }

            $answer->delete();

            return CommonResponse::sendSuccessResponse('Answer deleted successfully');
        } catch (Exception $e) {
            Log::error('Error deleting question answer: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('Failed to delete answer');
        }
    }
}
