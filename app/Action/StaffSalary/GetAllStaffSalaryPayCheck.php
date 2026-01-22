<?php

namespace App\Action\StaffSalary;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Query\Expression;

class GetAllStaffSalaryPayCheck
{
    public function __invoke(): array
    {
        try {
            $formattedMonth = date('Y-m');

            $staffSalary = DB::table('staff_salary')
                ->join('users', 'staff_salary.user_id', '=', 'users.id')
                ->join('branches', 'staff_salary.branch_id', '=', 'branches.id')
                ->leftJoin('employee_ot', function ($join) use ($formattedMonth) {
                    $join->on('staff_salary.user_id', '=', 'employee_ot.employee_id')
                        ->where('employee_ot.date', 'like', $formattedMonth.'%');
                })
                ->select(
                    'staff_salary.id',
                    'staff_salary.user_id',
                    'staff_salary.branch_id',
                    $this->getTotalOTAmountQuery(),
                    $this->getTotalSalaryQuery()
                )
                ->groupBy(
                    'staff_salary.id',
                    'staff_salary.user_id',
                    'staff_salary.branch_id',
                )
                ->get();

            if ($staffSalary->isEmpty()) {
                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponseWithData('staffSalary', $staffSalary);
        } catch (Exception $e) {
            Log::error('GetAllStaffSalaryError: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }

    private function getTotalOTAmountQuery(): Expression
    {
        return DB::raw('SUM(employee_ot.total_ot_amount) as total_ot_amount');
    }

    private function getTotalSalaryQuery(): Expression
    {
        return DB::raw('(staff_salary.basic_salary_amount + IFNULL(staff_salary.allocation_amount, 0)
        + IFNULL(SUM(employee_ot.total_ot_amount), 0)) as total_salary');
    }
}
