<?php

namespace App\Action\Notification;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetAllNotification
{
    public function __invoke(string $userId): array
    {
        if (empty($userId)) {
            return CommonResponse::sendBadRequestResponse('user');
        }

        $notifications = DB::table('notification_management')
            ->select(
                'id',
                'user_id',
                'notification_type',
                'notification_message',
                'notification_status',
            )
            ->where('user_id', $userId)
            ->where('notification_status', 'unread')
            ->get();

        if ($notifications->isEmpty()) {
            return CommonResponse::getNotFoundResponse('notification');
        }

        $data = [
            'notification_count' => $notifications->count(),
            'notifications' => $notifications,
        ];

        return CommonResponse::sendSuccessResponseWithData('notification', (object) $data);
    }
}
