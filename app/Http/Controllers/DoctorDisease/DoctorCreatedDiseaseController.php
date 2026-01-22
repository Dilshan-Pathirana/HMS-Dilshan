<?php

namespace App\Http\Controllers\DoctorDisease;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\DoctorDisease\DeleteDoctorDisease;
use App\Action\DoctorDisease\GetAllDoctorDisease;
use App\Action\DoctorDisease\CreateDoctorCreatedDisease;
use App\Action\DoctorDisease\UpdateDoctorCreatedDisease;
use App\Http\Requests\DoctorDisease\DoctorUpdateDiseaseRequest;
use App\Http\Requests\DoctorDisease\DoctorCreatedDiseaseRequest;

class DoctorCreatedDiseaseController extends Controller
{
    public function createDoctorDisease(DoctorCreatedDiseaseRequest $request, CreateDoctorCreatedDisease $createAction): JsonResponse
    {
        $validated = $request->validated();

        return response()->json($createAction($validated));
    }

    public function updateDoctorDisease(string $id, DoctorUpdateDiseaseRequest $request, UpdateDoctorCreatedDisease $updateDoctorCreatedDisease): JsonResponse
    {
        $validated = $request->validated();

        return response()->json($updateDoctorCreatedDisease($id, $validated));
    }

    public function getAllDoctorDisease(GetAllDoctorDisease $getAllDoctorDisease): JsonResponse
    {
        return response()->json($getAllDoctorDisease());
    }

    public function deleteDoctorDisease(string $id, DeleteDoctorDisease $deleteDoctorDisease): JsonResponse
    {
        return response()->json($deleteDoctorDisease($id));
    }
}
