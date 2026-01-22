<?php

namespace App\Action\Hospital\Leave;

use App\Models\AllUsers\User;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\LeavesManagement\AdminLeave;
use App\Models\LeavesManagement\LeavesManagement;
use App\Models\Notification\NotificationManagement;

class CreateLeave
{
    public function __invoke(array $validated): array
    {
        if (! $this->validateDates($validated['leaves_start_date'], $validated['leaves_end_date'])) {
            return CommonResponse::sendBadResponse('Invalid date range');
        }

        DB::beginTransaction();
        try {
            $leaveRequest = LeavesManagement::create([
                'user_id' => $validated['user_id'],
                'leaves_start_date' => $validated['leaves_start_date'],
                'leaves_end_date' => $validated['leaves_end_date'],
                'reason' => $validated['reason'] ?? null,
                'assigner' => $validated['assigner'] ?? null,
                'approval_date' => $validated['approval_date'] ?? null,
                'comments' => $validated['comments'] ?? null,
                'leaves_days' => $this->calculateLeaveDays(
                    $validated['leaves_start_date'],
                    $validated['leaves_end_date']
                ),
            ]);

            $leaveDays = $this->calculateLeaveDays($validated['leaves_start_date'], $validated['leaves_end_date']);
            $fullName = $this->getUserFullName($validated['user_id']);
            $notificationMessage = "A new leave request of {$leaveDays} days has been created by {$fullName}.";

            NotificationManagement::create([
                'user_id' => $validated['assigner'],
                'notification_type' => 1,
                'notification_message' => $notificationMessage,
                'notification_status' => 'unread',
            ]);

            AdminLeave::create([
                'leave_id' => $leaveRequest->id,
            ]);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Leave successfully created');
        } catch (\Exception $e) {
            Log::error('Error creating leave: '.$e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }

    private function validateDates(string $startDate, string $endDate): bool
    {
        try {
            $start = new \DateTime($startDate);
            $end = new \DateTime($endDate);

            return $start <= $end;
        } catch (\Exception $e) {
            Log::error('Date validation error: '.$e->getMessage());

            return false;
        }
    }

    private function calculateLeaveDays(string $startDate, string $endDate): int
    {
        try {
            $start = new \DateTime($startDate);
            $end = new \DateTime($endDate);

            return $end->diff($start)->days + 1;
        } catch (\Exception $e) {
            Log::error('Error calculating leave days: '.$e->getMessage());

            return 0;
        }
    }

    private function getUserFullName(string $userId): string
    {
        $user = User::find($userId);

        return $user ? "{$user->first_name} {$user->last_name}" : 'Unknown User';
    }
}
