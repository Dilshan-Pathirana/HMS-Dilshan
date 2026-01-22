<?php

namespace App\Http\Controllers\NotificationManagement;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\Notification\NotificationRead;
use App\Action\Notification\GetAllNotification;
use App\Http\Requests\Notification\NotificationReadRequest;
use Illuminate\Support\Facades\DB;

class NotificationManagementController extends Controller
{
    public function getNotificationByUserID(string $userId, GetAllNotification $getCashierUserNotification): JsonResponse
    {
        return response()->json($getCashierUserNotification($userId));
    }

    public function getUnreadCount(string $userId): JsonResponse
    {
        $count = DB::table('notification_management')
            ->where('user_id', $userId)
            ->where('notification_status', 'unread')
            ->count();

        return response()->json([
            'status' => 200,
            'count' => $count
        ]);
    }

    public function markNotificationsAsRead(NotificationReadRequest $request, NotificationRead $notificationRead): JsonResponse
    {
        $validatedNotificationReadRequest = $request->validated();

        if ($validatedNotificationReadRequest) {
            return response()->json($notificationRead($validatedNotificationReadRequest));
        }

        return response()->json();
    }

    public function markSingleNotificationAsRead(string $id): JsonResponse
    {
        DB::table('notification_management')
            ->where('id', $id)
            ->update(['notification_status' => 'read']);

        return response()->json([
            'status' => 200,
            'message' => 'Notification marked as read'
        ]);
    }

    public function deleteNotification(string $id): JsonResponse
    {
        DB::table('notification_management')
            ->where('id', $id)
            ->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Notification deleted'
        ]);
    }

    public function clearReadNotifications(Request $request): JsonResponse
    {
        $userId = $request->input('user_id');
        
        DB::table('notification_management')
            ->where('user_id', $userId)
            ->where('notification_status', 'read')
            ->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Read notifications cleared'
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->input('user_id');
        
        DB::table('notification_management')
            ->where('user_id', $userId)
            ->update(['notification_status' => 'read']);

        return response()->json([
            'status' => 200,
            'message' => 'All notifications marked as read'
        ]);
    }
}
