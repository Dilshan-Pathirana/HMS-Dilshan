<?php

namespace App\Action\QuestionAnswers;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\PatientSession\QuestionAnswer;

class CreateQuestionAnswer
{
    public function __invoke(array $data): array
    {
        try {
            QuestionAnswer::create([
                'question_id' => $data['question_id'],
                'answer' => $data['answer'],
            ]);

            return CommonResponse::sendSuccessResponse('Answer saved successfully');
        } catch (Exception $e) {
            Log::error('Failed to create question answer', [
                'error' => $e->getMessage(),
            ]);

            return CommonResponse::sendBadResponseWithMessage('Failed to save answer');
        }
    }
}
