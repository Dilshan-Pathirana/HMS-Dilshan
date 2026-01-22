<?php

namespace App\Action\EmployeeOT;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\EmployeeOT\EmployeeOT;
use App\Models\StaffSalary\StaffSalary;

class CreateEmployeeOT
{
    public function __invoke(array $validated): array
    {
        DB::beginTransaction();
        try {
            $staffSalary = StaffSalary::where('user_id', $validated['employee_id'])->first();

            if (! $staffSalary) {
                return CommonResponse::sendBadResponseWithMessage('No staff salary found for the given employee.');
            }

            $totalOtAmount = $this->totalAmountCalculate($validated);

            EmployeeOT::create([
                'employee_id' => $validated['employee_id'],
                'date' => $validated['date'],
                'hours_worked' => $validated['hours_worked'],
                'ot_rate' => $validated['ot_rate'],
                'total_ot_amount' => $totalOtAmount,
            ]);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Employee OT created successfully');
        } catch (\Exception $e) {
            Log::error('Employee OT Error: '.$e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }

    private function totalAmountCalculate(array $validated): float
    {
        return round(($validated['hours_worked'] * $validated['ot_rate']), 2);
    }
}
