<?php

namespace App\Action\Notification;

use App\Response\CommonResponse;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Notification\NotificationManagement;

class NotificationRead
{
    public function __invoke(array $request): array
    {
        try {
            $updated = NotificationManagement::whereIn('id', $request['notification_ids'])
                ->update(['notification_status' => 'read']);

            if ($updated > 0) {
                return CommonResponse::sendSuccessResponse('Notifications read successfully.');
            }

            return CommonResponse::getNotFoundResponse('notifications');
        } catch (\Exception $e) {
            return [
                'status' => Response::HTTP_INTERNAL_SERVER_ERROR,
                'message' => 'An error occurred while marking notifications as read.',
                'error' => $e->getMessage(),
            ];
        }
    }
}
