<?php

namespace App\Action\Hospital\Leave;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetLeavesByUserID
{
    public function __invoke(string $userId): array
    {
        try {
            $leaves = DB::table('leaves_management')
                ->join('users as leave_user', 'leaves_management.user_id', '=', 'leave_user.id')
                ->leftJoin('users as assigner_user', 'leaves_management.assigner', '=', 'assigner_user.id')
                ->leftJoin('admin_leave_management', 'leaves_management.id', '=', 'admin_leave_management.leave_id')
                ->select(
                    'leaves_management.id',
                    'leaves_management.user_id',
                    'leave_user.first_name as user_first_name',
                    'leave_user.last_name as user_last_name',
                    'leaves_management.leaves_start_date',
                    'leaves_management.leaves_end_date',
                    'leaves_management.reason',
                    'leaves_management.assigner',
                    'leaves_management.leaves_days',
                    'leaves_management.comments',
                    'assigner_user.first_name as assigner_first_name',
                    'assigner_user.last_name as assigner_last_name',
                    'leaves_management.approval_date',
                    'admin_leave_management.comments as admin_comments',
                    'admin_leave_management.status as admin_status',
                )
                ->where('leaves_management.user_id', '=', $userId)
                ->get();

            if ($leaves->isEmpty()) {
                Log::warning('No leaves found for user_id: '.$userId);

                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponseWithData('leaves', $leaves);
        } catch (\Exception $e) {
            Log::error('GetLeavesByUserID Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
