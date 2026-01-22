<?php

namespace App\Http\Controllers\StaffSalary;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\StaffSalary\CreateStaffSalaryPay;
use App\Action\StaffSalary\GetAllStaffSalaryPay;
use App\Action\StaffSalary\UpdateStaffSalaryPay;
use App\Action\StaffSalary\GetAllStaffSalaryPayCheck;
use App\Action\StaffSalary\GetAllStaffSalaryPayFilter;
use App\Http\Requests\StaffSalary\CreateStaffSalaryPayRequest;
use App\Http\Requests\StaffSalary\UpdateStaffSalaryPayRequest;

class StaffSalaryPay extends Controller
{
    public function createStaffSalaryPay(CreateStaffSalaryPayRequest $request, CreateStaffSalaryPay $createStaffSalaryPay): JsonResponse
    {
        $validatedStaffSalaryPayCreateRequest = $request->validated();

        if ($validatedStaffSalaryPayCreateRequest) {
            return response()->json($createStaffSalaryPay($validatedStaffSalaryPayCreateRequest));
        }

        return response()->json();
    }

    public function updateStaffSalary(UpdateStaffSalaryPayRequest $request, UpdateStaffSalaryPay $updateStaffSalaryPay, string $id): JsonResponse
    {
        $validatedData = $request->validated();
        $result = $updateStaffSalaryPay($validatedData, $id);

        return response()->json($result);
    }

    public function getAllStaffSalaryPayCheck(GetAllStaffSalaryPayCheck $getAllStaffSalaryPayCheck): JsonResponse
    {
        return response()->json($getAllStaffSalaryPayCheck());
    }

    public function getAllStaffSalaryPay(GetAllStaffSalaryPay $getAllStaffSalaryPay): JsonResponse
    {
        return response()->json($getAllStaffSalaryPay());
    }

    public function getAllStaffSalaryPayFilter(Request $request, GetAllStaffSalaryPayFilter $getAllStaffSalaryPay): JsonResponse
    {
        $filters = $request->only(['user_id', 'status', 'month']);

        return response()->json($getAllStaffSalaryPay($filters));
    }
}
