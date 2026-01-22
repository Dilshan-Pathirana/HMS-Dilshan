<?php

namespace App\Action\StaffSalary;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllStaffSalary
{
    public function __invoke(): array
    {
        try {
            $staffSalary = DB::table('staff_salary')
                ->join('users', 'staff_salary.user_id', '=', 'users.id')
                ->join('branches', 'staff_salary.branch_id', '=', 'branches.id')
                ->leftJoin('employee_bank_details', 'staff_salary.user_id', '=', 'employee_bank_details.user_id')
                ->select(
                    'staff_salary.id',
                    'staff_salary.user_id',
                    'users.first_name as user_first_name',
                    'users.last_name as user_last_name',
                    'staff_salary.branch_id',
                    'branches.center_name as branch_center_name',
                    'staff_salary.basic_salary_amount',
                    'staff_salary.allocation_amount',
                    'staff_salary.rate_for_hour',
                    'staff_salary.maximum_hours_can_work',
                    'employee_bank_details.bank_name',
                    'employee_bank_details.branch_name',
                    'employee_bank_details.branch_code',
                    'employee_bank_details.account_number',
                    'employee_bank_details.account_owner_name'
                )
                ->get();

            if ($staffSalary->isEmpty()) {
                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponseWithData('staffSalary', $staffSalary);
        } catch (\Exception $e) {
            Log::error('GetAllStaffSalaryError: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
