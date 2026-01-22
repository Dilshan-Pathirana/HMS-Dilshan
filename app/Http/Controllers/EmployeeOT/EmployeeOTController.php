<?php

namespace App\Http\Controllers\EmployeeOT;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\EmployeeOT\CreateEmployeeOT;
use App\Action\EmployeeOT\DeleteEmployeeOT;
use App\Action\EmployeeOT\GetAllEmployeeOT;
use App\Action\EmployeeOT\UpdateEmployeeOT;
use App\Http\Requests\EmployeeOT\CreateEmployeeOTRequest;
use App\Http\Requests\EmployeeOT\UpdateEmployeeOTRequest;

class EmployeeOTController extends Controller
{
    public function createEmployeeOT(CreateEmployeeOTRequest $request, CreateEmployeeOT $createEmployeeOT): JsonResponse
    {
        $validatedEmployeeOTRequest = $request->validated();

        if ($validatedEmployeeOTRequest) {
            return response()->json($createEmployeeOT($validatedEmployeeOTRequest));
        }

        return response()->json();
    }

    public function getAllEmployeeOT(GetAllEmployeeOT $getAllEmployeeOT): JsonResponse
    {
        return response()->json($getAllEmployeeOT());
    }

    public function updateEmployeeOT(UpdateEmployeeOTRequest $request, UpdateEmployeeOT $updateEmployeeOT, string $id): JsonResponse
    {
        $validated = $request->validated();
        $result = $updateEmployeeOT($validated, $id);

        return response()->json($result);
    }

    public function deleteEmployeeOT(string $id, DeleteEmployeeOT $deleteEmployeeOT): JsonResponse
    {
        $result = $deleteEmployeeOT($id);

        return response()->json($result);
    }
}
