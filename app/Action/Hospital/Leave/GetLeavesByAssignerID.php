<?php

namespace App\Action\Hospital\Leave;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetLeavesByAssignerID
{
    public function __invoke(string $assigner_id): array
    {
        try {
            $leaves = DB::table('leaves_management')
                ->join('users as leave_user', 'leaves_management.user_id', '=', 'leave_user.id')
                ->leftJoin('users as assigner_user', 'leaves_management.assigner', '=', 'assigner_user.id')
                ->select(
                    'leaves_management.id',
                    'leave_user.first_name as user_first_name',
                    'leave_user.last_name as user_last_name',
                    'leaves_management.leaves_start_date',
                    'leaves_management.leaves_end_date',
                    'leaves_management.reason',
                    'leaves_management.status',
                    'leaves_management.approval_date',
                    'leaves_management.comments',
                    'leaves_management.leaves_days'
                )
                ->where('leaves_management.assigner', '=', $assigner_id)
                ->get();

            if ($leaves->isEmpty()) {
                Log::warning('No leaves found for assigner_id: '.$assigner_id);

                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponseWithData('Leaves fetched successfully.', $leaves);
        } catch (\Exception $e) {
            Log::error('Error in GetLeavesByAssignerID: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
