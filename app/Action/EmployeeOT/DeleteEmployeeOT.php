<?php

namespace App\Action\EmployeeOT;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\EmployeeOT\EmployeeOT;

class DeleteEmployeeOT
{
    public function __invoke(string $id): array
    {
        try {
            $employeeOT = EmployeeOT::findOrFail($id);
            $employeeOT->delete();

            return CommonResponse::sendSuccessResponse('Employee OT deleted successfully');
        } catch (\Exception $e) {
            Log::error('DeleteEmployeeOT Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
