<?php

namespace App\Action\StaffSalary;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\StaffSalary\StaffSalary;
use App\Models\StaffSalary\EmployeeBankDetails;

class CreateStaffSalary
{
    public function __invoke(array $validated): array
    {
        DB::beginTransaction();
        try {
            $existingStaffSalary = StaffSalary::where('user_id', $validated['user_id'])->first();

            if ($existingStaffSalary) {
                return CommonResponse::sendBadResponseWithMessage('Staff salary already exists for this user.');
            }

            StaffSalary::create([
                'user_id' => $validated['user_id'],
                'branch_id' => $validated['branch_id'],
                'basic_salary_amount' => $validated['basic_salary_amount'],
                'allocation_amount' => $validated['allocation_amount'],
                'rate_for_hour' => $validated['rate_for_hour'],
                'maximum_hours_can_work' => $validated['maximum_hours_can_work'],
            ]);

            EmployeeBankDetails::create([
                'user_id' => $validated['user_id'],
                'bank_name' => $validated['bank_name'],
                'branch_name' => $validated['branch_name'],
                'branch_code' => $validated['branch_code'],
                'account_number' => $validated['account_number'],
                'account_owner_name' => $validated['account_owner_name'],
            ]);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Staff Salary created successfully');
        } catch (\Exception $e) {
            Log::error('StaffSalary Error: '.$e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
