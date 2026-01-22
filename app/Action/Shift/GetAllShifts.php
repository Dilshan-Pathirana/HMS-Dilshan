<?php

namespace App\Action\Shift;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetAllShifts
{
    public function __invoke(): array
    {
        try {
            Log::info('Fetching shifts with relationships manually');

            // Build query with optional status column
            $hasStatusColumn = DB::getSchemaBuilder()->hasColumn('shift_management', 'status');
            $hasAcknowledgedAtColumn = DB::getSchemaBuilder()->hasColumn('shift_management', 'acknowledged_at');
            
            $selectColumns = [
                'shift_management.id',
                'shift_management.user_id',
                'users.first_name as user_first_name',
                'users.last_name as user_last_name',
                'users.phone as user_phone',
                'users.role_as as user_role_as',
                'shift_management.branch_id',
                'branches.center_name as branch_center_name',
                'shift_management.shift_type',
                'shift_management.days_of_week',
                'shift_management.start_time',
                'shift_management.end_time',
                'shift_management.notes'
            ];
            
            // Add status column if it exists
            if ($hasStatusColumn) {
                $selectColumns[] = 'shift_management.status';
            }
            
            // Add acknowledged_at column if it exists
            if ($hasAcknowledgedAtColumn) {
                $selectColumns[] = 'shift_management.acknowledged_at';
            }

            $shifts = DB::table('shift_management')
                ->join('users', 'shift_management.user_id', '=', 'users.id')
                ->join('branches', 'shift_management.branch_id', '=', 'branches.id')
                ->select($selectColumns)
                ->get();
            
            // Add default status for shifts without status column
            if (!$hasStatusColumn) {
                $shifts = $shifts->map(function($shift) {
                    $shift->status = 'pending';
                    return $shift;
                });
            }

            if ($shifts->isEmpty()) {
                return CommonResponse::sendBadResponse();
            }

            return CommonResponse::sendSuccessResponseWithData('shifts', $shifts);
        } catch (\Exception $e) {
            Log::error('GetAllShifts Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
