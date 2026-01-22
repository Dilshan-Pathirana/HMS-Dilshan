<?php

namespace App\Domain\Repositories;

use App\Models\Notification;
use Illuminate\Support\Collection;

interface NotificationRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get unread notifications for user
     */
    public function getUnreadByUser(int $userId): Collection;

    /**
     * Get notifications by user
     */
    public function getByUser(int $userId, int $perPage = 15);

    /**
     * Mark as read
     */
    public function markAsRead(int $id): bool;

    /**
     * Mark all as read for user
     */
    public function markAllAsReadForUser(int $userId): bool;

    /**
     * Get notifications by type
     */
    public function getByType(string $type, int $userId): Collection;

    /**
     * Get pending notifications
     */
    public function getPending(): Collection;

    /**
     * Delete old notifications
     */
    public function deleteOlderThan(int $days): int;
}
