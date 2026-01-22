<?php

namespace App\Action\EmployeeOT;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllEmployeeOT
{
    public function __invoke(): array
    {
        try {
            $employeeOT = DB::table('employee_ot')
                ->join('users', 'employee_ot.employee_id', '=', 'users.id')
                ->select(
                    'employee_ot.id',
                    'employee_ot.employee_id',
                    'users.first_name as user_first_name',
                    'users.last_name as user_last_name',
                    'employee_ot.date',
                    'employee_ot.hours_worked',
                    'employee_ot.ot_rate',
                    'employee_ot.total_ot_amount',
                )
                ->get();

            if ($employeeOT->isEmpty()) {
                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponseWithData('employeeOT', $employeeOT);
        } catch (\Exception $e) {
            Log::error('GetAllEmployeeOTError: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
