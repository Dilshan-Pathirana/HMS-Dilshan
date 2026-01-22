<?php

namespace App\Action\EmployeeOT;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\EmployeeOT\EmployeeOT;

class UpdateEmployeeOT
{
    public function __invoke(array $data, string $id): array
    {
        DB::beginTransaction();

        try {
            $employeeOT = EmployeeOT::findOrFail($id);

            $totalOtAmount = $this->totalAmountCalculate($data);

            $employeeOT->update([
                'employee_id' => $data['employee_id'],
                'date' => $data['date'],
                'hours_worked' => $data['hours_worked'],
                'ot_rate' => $data['ot_rate'],
                'total_ot_amount' => $totalOtAmount,
            ]);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Employee OT updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('UpdateEmployeeOT Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }

    private function totalAmountCalculate(array $data): int|float
    {
        return round(($data['hours_worked'] * $data['ot_rate']), 2);
    }
}
