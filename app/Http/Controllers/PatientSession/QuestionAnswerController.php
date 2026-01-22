<?php

namespace App\Http\Controllers\PatientSession;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\QuestionAnswers\CreateQuestionAnswer;
use App\Action\QuestionAnswers\DeleteQuestionAnswer;
use App\Action\QuestionAnswers\UpdateQuestionAnswer;
use App\Action\QuestionAnswers\GetAnswersByQuestionId;
use App\Http\Requests\PatientSessions\QuestionAnswerRequest;

class QuestionAnswerController extends Controller
{
    public function addNewAnswer(QuestionAnswerRequest $request, CreateQuestionAnswer $action): JsonResponse
    {
        $validated = $request->validated();

        return response()->json($action($validated));
    }

    public function updateQuestionAnswer(string $id, QuestionAnswerRequest $request, UpdateQuestionAnswer $updateQuestionAnswer): JsonResponse
    {
        $validated = $request->validated();

        return response()->json($updateQuestionAnswer($id, $validated));
    }

    public function deleteQuestionAnswer(string $id, DeleteQuestionAnswer $deleteQuestionAnswer): JsonResponse
    {
        return response()->json($deleteQuestionAnswer($id));
    }

    public function getAnswersByQuestionId(string $questionId, GetAnswersByQuestionId $getAnswersByQuestionId): JsonResponse
    {
        return response()->json($getAnswersByQuestionId($questionId));
    }
}
