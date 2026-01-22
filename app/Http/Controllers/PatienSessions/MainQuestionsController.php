<?php

namespace App\Http\Controllers\PatienSessions;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\PatientSessions\MainQuestionRequest;
use App\Action\PatientSessions\MainQuestions\CreateMainQuestions;
use App\Action\PatientSessions\MainQuestions\DeleteMainQuestions;
use App\Action\PatientSessions\MainQuestions\GetAllMainQuestions;
use App\Action\PatientSessions\MainQuestions\UpdateMainQuestions;

class MainQuestionsController extends Controller
{
    public function addMainQuestion(MainQuestionRequest $request, CreateMainQuestions $createMainQuestions): JsonResponse
    {
        $validatedRequest = $request->validated();

        return response()->json($createMainQuestions($validatedRequest));
    }

    public function getAllMainQuestions(GetAllMainQuestions $getAllMainQuestions): JsonResponse
    {
        return response()->json($getAllMainQuestions());
    }

    public function getDoctorQuestions(string $doctorId, GetAllMainQuestions $getAllMainQuestions): JsonResponse
    {
        return response()->json($getAllMainQuestions($doctorId));
    }

    public function updateMainQuestion(string $id, MainQuestionRequest $request, UpdateMainQuestions $updateMainQuestions): JsonResponse
    {
        $validatedRequest = $request->validated();

        return response()->json($updateMainQuestions($id, $validatedRequest));
    }

    public function deleteMainQuestion(string $id, DeleteMainQuestions $deleteMainQuestions): JsonResponse
    {
        return response()->json($deleteMainQuestions($id));
    }
}
