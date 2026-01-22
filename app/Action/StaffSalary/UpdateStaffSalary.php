<?php

namespace App\Action\StaffSalary;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\StaffSalary\StaffSalary;
use App\Models\StaffSalary\EmployeeBankDetails;

class UpdateStaffSalary
{
    public function __invoke(array $data, string $id): array
    {
        DB::beginTransaction();

        try {
            $shift = StaffSalary::findOrFail($id);

            $shift->update([
                'user_id' => $data['user_id'],
                'branch_id' => $data['branch_id'],
                'basic_salary_amount' => $data['basic_salary_amount'],
                'allocation_amount' => $data['allocation_amount'],
                'rate_for_hour' => $data['rate_for_hour'],
                'maximum_hours_can_work' => $data['maximum_hours_can_work'],
            ]);

            EmployeeBankDetails::updateOrCreate(
                ['user_id' => $data['user_id']],
                [
                    'bank_name' => $data['bank_name'],
                    'branch_name' => $data['branch_name'],
                    'branch_code' => $data['branch_code'],
                    'account_number' => $data['account_number'],
                    'account_owner_name' => $data['account_owner_name'],
                ]
            );

            DB::commit();

            return CommonResponse::sendSuccessResponse('Staff Salary Details updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('UpdateStaffSalary Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
