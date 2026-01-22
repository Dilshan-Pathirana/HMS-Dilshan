<?php

namespace App\Action\Hospital\Leave;

use Carbon\Carbon;
use App\Models\AllUsers\User;
use App\Response\CommonResponse;
use App\Models\LeavesManagement\AdminLeave;
use App\Models\LeavesManagement\LeavesManagement;
use App\Models\Notification\NotificationManagement;

class LeaveManage
{
    private LeavesManagement $leaveRequest;

    public function __construct(string $leaveId)
    {
        $this->leaveRequest = LeavesManagement::findOrFail($leaveId);
    }

    public function handleApprovalOrRejection(string $status, ?string $comments = null): array
    {
        $validStatuses = [
            'approve' => 'Approved',
            'reject' => 'Rejected',
        ];

        if ($this->isPending() && array_key_exists($status, $validStatuses)) {
            $this->leaveRequest->status = $validStatuses[$status];
            $this->leaveRequest->approval_date = Carbon::now()->toDateString();
            $this->leaveRequest->comments = $comments;
            $this->leaveRequest->save();

            $this->updateAdminLeaveStatus($status);

            $this->sendNotification($status, $comments);

            return CommonResponse::sendSuccessResponse(
                'Leave request '.$validStatuses[$status].' successfully.'
            );
        }

        return CommonResponse::sendBadResponse();
    }

    private function isPending(): bool
    {
        return $this->leaveRequest->status === 'Pending';
    }

    private function updateAdminLeaveStatus(string $status): void
    {
        $adminLeave = AdminLeave::where('leave_id', $this->leaveRequest->id)->first();

        if (! $adminLeave) {
            AdminLeave::create([
                'leave_id' => $this->leaveRequest->id,
                'status' => $status === 'reject' ? 'Rejected' : null,
                'admin_access' => 2,
            ]);
        } else {
            $adminLeave->status = $status === 'reject' ? 'Rejected' : $adminLeave->status;
            $adminLeave->admin_access = 2;
            $adminLeave->save();
        }
    }

    private function sendNotification(string $status, ?string $comments): void
    {
        $user = User::find($this->leaveRequest->user_id);
        $userName = $user ? "{$user->first_name} {$user->last_name}" : 'Unknown User';
        $assigner = User::find($this->leaveRequest->assigner);
        $assignerName = $assigner ? "{$assigner->first_name} {$assigner->last_name}" : 'Unknown';
        $leaveDays = $this->leaveRequest->leaves_days;

        if ($status === 'approve') {
            $userMessage = "Your leave request has been approved by {$assignerName}. Please wait for Admin Access.";
            $adminMessage = "The leave request submitted by {$userName} for {$leaveDays} days has been accepted by {$assignerName}.";
        } else {
            $userMessage = "Your leave request has been rejected by {$assignerName}. Reason: {$comments}";
            $adminMessage = "The leave request by {$userName} has been rejected by {$assignerName}. Reason: {$comments}";
        }

        NotificationManagement::create([
            'user_id' => $this->leaveRequest->user_id,
            'notification_type' => $status === 'approve' ? 2 : 3,
            'notification_message' => $userMessage,
            'notification_status' => 'unread',
        ]);

        if ($status === 'approve') {
            $admins = User::where('role_as', 1)->get();
            foreach ($admins as $admin) {
                NotificationManagement::create([
                    'user_id' => $admin->id,
                    'notification_type' => 2,
                    'notification_message' => $adminMessage,
                    'notification_status' => 'unread',
                ]);
            }
        }
    }
}
