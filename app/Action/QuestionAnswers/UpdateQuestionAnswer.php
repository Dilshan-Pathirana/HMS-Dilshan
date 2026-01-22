<?php

namespace App\Action\QuestionAnswers;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\PatientSession\QuestionAnswer;

class UpdateQuestionAnswer
{
    public function __invoke(string $id, array $data): array
    {
        try {
            $answer = QuestionAnswer::find($id);

            if (! $answer) {
                return CommonResponse::sendBadResponseWithMessage('Answer not found');
            }

            $answer->update([
                'question_id' => $data['question_id'],
                'answer' => $data['answer'],
            ]);

            return CommonResponse::sendSuccessResponse('Answer updated successfully');
        } catch (Exception $e) {
            Log::error('Failed to update question answer', [
                'error' => $e->getMessage(),
            ]);

            return CommonResponse::sendBadResponseWithMessage('Failed to update answer');
        }
    }
}
