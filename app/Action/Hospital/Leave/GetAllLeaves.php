<?php

namespace App\Action\Hospital\Leave;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllLeaves
{
    public function __invoke(): array
    {
        try {
            $leaves = DB::table('admin_leave_management')
                ->join('leaves_management', 'admin_leave_management.leave_id', '=', 'leaves_management.id')
                ->join('users as leave_user', 'leaves_management.user_id', '=', 'leave_user.id')
                ->leftJoin('users as assigner_user', 'leaves_management.assigner', '=', 'assigner_user.id')
                ->select(
                    'admin_leave_management.id',
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
                    'admin_leave_management.created_at as admin_created_at',
                    'admin_leave_management.updated_at as admin_updated_at'
                )
                ->where('admin_leave_management.admin_access', '=', 2)
                ->get();

            if ($leaves->isEmpty()) {
                Log::warning('No leave records found with admin_access = 2.');

                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponseWithData('leaves', $leaves);
        } catch (\Exception $e) {
            Log::error('GetAllLeaves Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
