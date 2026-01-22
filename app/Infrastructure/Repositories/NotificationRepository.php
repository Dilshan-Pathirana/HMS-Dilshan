<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\NotificationRepositoryInterface;
use App\Models\Notification;
use Illuminate\Support\Collection;

class NotificationRepository extends BaseRepository implements NotificationRepositoryInterface
{
    public function __construct(Notification $model)
    {
        parent::__construct($model);
    }

    public function getUnreadByUser(int $userId): Collection
    {
        return $this->model->unread()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getByUser(int $userId, int $perPage = 15)
    {
        return $this->model->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function markAsRead(int $id): bool
    {
        $notification = $this->model->find($id);
        if ($notification) {
            $notification->markAsRead();
            return true;
        }
        return false;
    }

    public function markAllAsReadForUser(int $userId): bool
    {
        return $this->model->where('user_id', $userId)
            ->where('status', '!=', 'read')
            ->update([
                'status' => 'read',
                'read_at' => now()
            ]);
    }

    public function getByType(string $type, int $userId): Collection
    {
        return $this->model->byType($type)
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getPending(): Collection
    {
        return $this->model->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function deleteOlderThan(int $days): int
    {
        return $this->model->where('created_at', '<', now()->subDays($days))
            ->where('status', 'read')
            ->delete();
    }
}
