<?php

namespace App\Action\StaffSalary;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllStaffSalaryPayFilter
{
    public function __invoke(array $filters = []): array
    {
        try {
            $query = DB::table('staff_salary_pay')
                ->join('users', 'staff_salary_pay.user_id', '=', 'users.id')
                ->join('branches', 'staff_salary_pay.branch_id', '=', 'branches.id')
                ->join('staff_salary', 'staff_salary_pay.user_id', '=', 'staff_salary.user_id')
                ->leftJoin('employee_bank_details', 'staff_salary.user_id', '=', 'employee_bank_details.user_id')
                ->leftJoin('employee_ot', function ($join) {
                    $join->on('staff_salary_pay.user_id', '=', 'employee_ot.employee_id')
                        ->whereRaw('DATE_FORMAT(employee_ot.date, "%Y-%m") = staff_salary_pay.month');
                })
                ->select(
                    'staff_salary_pay.id',
                    'staff_salary_pay.user_id',
                    'users.first_name as user_first_name',
                    'users.last_name as user_last_name',
                    'staff_salary_pay.branch_id',
                    'branches.center_name as branch_center_name',
                    'staff_salary_pay.paid_salary_amount',
                    'staff_salary_pay.month',
                    'staff_salary_pay.status',
                    'staff_salary.basic_salary_amount',
                    'staff_salary.allocation_amount',
                    'employee_bank_details.bank_name',
                    'employee_bank_details.branch_name',
                    'employee_bank_details.branch_code',
                    'employee_bank_details.account_number',
                    'employee_bank_details.account_owner_name',
                    DB::raw('COALESCE(SUM(employee_ot.hours_worked), 0) as total_hours_worked'),
                    DB::raw('COALESCE(SUM(employee_ot.total_ot_amount), 0) as total_ot_amount')
                )
                ->groupBy(
                    'staff_salary_pay.id',
                    'staff_salary_pay.user_id',
                    'users.first_name',
                    'users.last_name',
                    'staff_salary_pay.branch_id',
                    'branches.center_name',
                    'staff_salary_pay.paid_salary_amount',
                    'staff_salary_pay.month',
                    'staff_salary_pay.status',
                    'staff_salary.basic_salary_amount',
                    'staff_salary.allocation_amount',
                    'employee_bank_details.bank_name',
                    'employee_bank_details.branch_name',
                    'employee_bank_details.branch_code',
                    'employee_bank_details.account_number',
                    'employee_bank_details.account_owner_name',
                );

            if (! empty($filters['user_id'])) {
                $query->whereIn('staff_salary_pay.user_id', (array) $filters['user_id']);
            }

            if (! empty($filters['status'])) {
                $query->where('staff_salary_pay.status', $filters['status']);
            }

            if (! empty($filters['month'])) {
                $query->where('staff_salary_pay.month', $filters['month']);
            }

            $staffSalaryPay = $query->get();

            if ($staffSalaryPay->isEmpty()) {
                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponseWithData('staffSalaryPay', $staffSalaryPay);
        } catch (\Exception $e) {
            Log::error('GetAllStaffSalaryPayFilter Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
