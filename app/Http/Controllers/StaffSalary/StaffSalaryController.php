<?php

namespace App\Http\Controllers\StaffSalary;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\StaffSalary\CreateStaffSalary;
use App\Action\StaffSalary\DeleteStaffSalary;
use App\Action\StaffSalary\GetAllStaffSalary;
use App\Action\StaffSalary\UpdateStaffSalary;
use App\Http\Requests\StaffSalary\CreateStaffSalaryRequest;
use App\Http\Requests\StaffSalary\UpdateStaffSalaryRequest;

class StaffSalaryController extends Controller
{
    public function createStaffSalary(CreateStaffSalaryRequest $request, CreateStaffSalary $createStaffSalary): JsonResponse
    {
        $validatedStaffSalaryCreateRequest = $request->validated();

        if ($validatedStaffSalaryCreateRequest) {
            return response()->json($createStaffSalary($validatedStaffSalaryCreateRequest));
        }

        return response()->json();
    }

    public function getAllStaffSalary(GetAllStaffSalary $getAllStaffSalary): JsonResponse
    {
        return response()->json($getAllStaffSalary());
    }

    public function updateStaffSalary(UpdateStaffSalaryRequest $request, UpdateStaffSalary $updateStaffSalary, string $id): JsonResponse
    {
        $validated = $request->validated();
        $result = $updateStaffSalary($validated, $id);

        return response()->json($result);
    }

    public function deleteStaffSalary(string $id, DeleteStaffSalary $deleteStaffSalary): JsonResponse
    {
        $result = $deleteStaffSalary($id);

        return response()->json($result);
    }
}
