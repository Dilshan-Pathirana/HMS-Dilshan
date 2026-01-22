<?php

namespace App\Action\StaffSalary;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\StaffSalary\StaffSalaryPay;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UpdateStaffSalaryPay
{
    public function __invoke(array $data, string $id): array
    {
        DB::beginTransaction();

        try {
            $staffSalary = StaffSalaryPay::findOrFail($id);

            $staffSalary->update(['status' => $data['status']]);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Staff Salary Pay status updated successfully.');
        } catch (ModelNotFoundException $e) {
            DB::rollBack();
            Log::error('Staff Salary Pay Record Not Found: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('UpdateStaffSalaryPay Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
