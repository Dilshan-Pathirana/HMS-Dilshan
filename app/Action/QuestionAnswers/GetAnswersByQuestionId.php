<?php

namespace App\Action\QuestionAnswers;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAnswersByQuestionId
{
    public function __invoke(string $questionId): array
    {
        try {
            $answers = DB::table('question_answer')
                ->join('main_question', 'question_answer.question_id', '=', 'main_question.id')
                ->select(
                    'question_answer.id',
                    'question_answer.question_id',
                    'main_question.question as question_text',
                    'question_answer.answer',
                )
                ->where('question_answer.question_id', $questionId)
                ->get();

            return CommonResponse::sendSuccessResponseWithData('question_answers', $answers);
        } catch (Exception $e) {
            Log::error('Error fetching question answers: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
