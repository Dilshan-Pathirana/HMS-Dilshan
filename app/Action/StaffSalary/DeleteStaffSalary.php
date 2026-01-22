<?php

namespace App\Action\StaffSalary;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\StaffSalary\StaffSalary;
use App\Models\StaffSalary\EmployeeBankDetails;

class DeleteStaffSalary
{
    public function __invoke(string $id): array
    {
        DB::beginTransaction();

        try {
            $staffSalary = StaffSalary::findOrFail($id);

            EmployeeBankDetails::where('user_id', $staffSalary->user_id)->delete();
            $staffSalary->delete();

            DB::commit();

            return CommonResponse::sendSuccessResponse('Staff Salary Details deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DeleteStaffSalary Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
