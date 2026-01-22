<?php

namespace App\Action\StaffSalary;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\StaffSalary\StaffSalaryPay;

class CreateStaffSalaryPay
{
    public function __invoke(array $validated): array
    {
        DB::beginTransaction();
        try {
            StaffSalaryPay::create([
                'user_id' => $validated['user_id'],
                'branch_id' => $validated['branch_id'],
                'paid_salary_amount' => $validated['paid_salary_amount'],
                'month' => $validated['month'],
            ]);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Salary Pay successfully');
        } catch (\Exception $e) {
            Log::error('StaffSalaryPay Error: '.$e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
