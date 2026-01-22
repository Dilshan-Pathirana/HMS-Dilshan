<?php

namespace App\Action\Shift;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllShiftsUserID
{
    public function __invoke(string $userId): array
    {
        try {
            $shifts = DB::table('shift_management')
                ->join('users', 'shift_management.user_id', '=', 'users.id')
                ->join('branches', 'shift_management.branch_id', '=', 'branches.id')
                ->select(
                    'shift_management.id',
                    'shift_management.user_id',
                    'users.first_name as user_first_name',
                    'users.last_name as user_last_name',
                    'shift_management.branch_id',
                    'branches.center_name as branch_center_name',
                    'shift_management.shift_type',
                    'shift_management.days_of_week',
                    'shift_management.start_time',
                    'shift_management.end_time',
                    'shift_management.notes'
                )
                ->where('shift_management.user_id', '=', $userId)
                ->get();

            if ($shifts->isEmpty()) {
                Log::warning('No shifts found for user_id: '.$userId);

                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponseWithData('shifts', $shifts);
        } catch (\Exception $e) {
            Log::error('GetAllShiftsUserID Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
