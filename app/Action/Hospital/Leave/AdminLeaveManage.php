<?php

namespace App\Action\Hospital\Leave;

use App\Response\CommonResponse;
use App\Models\LeavesManagement\AdminLeave;
use App\Models\LeavesManagement\LeavesManagement;
use App\Models\Notification\NotificationManagement;

class AdminLeaveManage
{
    private AdminLeave $leaveRequest;

    public function __construct(string $leaveId)
    {
        $this->leaveRequest = AdminLeave::findOrFail($leaveId);
    }

    public function adminHandleApprovalOrRejection(string $status, ?string $comments = null): array
    {
        $validStatuses = [
            'approve' => 'Approved',
            'reject' => 'Rejected',
        ];

        if ($this->isPending() && array_key_exists($status, $validStatuses)) {
            $this->leaveRequest->status = $validStatuses[$status];
            $this->leaveRequest->comments = $comments;
            $this->leaveRequest->save();

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

    private function sendNotification(string $status, ?string $comments): void
    {
        $leaveManagement = LeavesManagement::where('id', $this->leaveRequest->leave_id)->first();
        $userId = $leaveManagement ? $leaveManagement->user_id : null;

        if (! $userId) {
            return;
        }

        $notificationMessage = $status === 'approve'
            ? 'Your leave request has been approved by the admin.'
            : 'Your leave request has been rejected by the admin. Reason: '.($comments ?? 'No reason provided.');

        NotificationManagement::create([
            'user_id' => $userId,
            'notification_type' => $status === 'approve' ? 4 : 5,
            'notification_message' => $notificationMessage,
            'notification_status' => 'unread',
        ]);
    }
}
