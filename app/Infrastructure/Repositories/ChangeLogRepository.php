<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\ChangeLogRepositoryInterface;
use App\Models\ChangeLog;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

class ChangeLogRepository extends BaseRepository implements ChangeLogRepositoryInterface
{
    public function __construct(ChangeLog $model)
    {
        parent::__construct($model);
    }

    public function getByEntity(string $entityType, int $entityId): Collection
    {
        return $this->model->byEntityType($entityType)
            ->where('entity_id', $entityId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getByUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getByAction(string $action, int $centerId): Collection
    {
        return $this->model->byAction($action)
            ->where('center_id', $centerId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): Collection
    {
        return $this->model->dateRange($startDate, $endDate)
            ->where('center_id', $centerId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function search(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (isset($filters['entity_type'])) {
            $query->byEntityType($filters['entity_type']);
        }

        if (isset($filters['action'])) {
            $query->byAction($filters['action']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['center_id'])) {
            $query->where('center_id', $filters['center_id']);
        }

        if (isset($filters['start_date']) && isset($filters['end_date'])) {
            $query->dateRange(
                Carbon::parse($filters['start_date']),
                Carbon::parse($filters['end_date'])
            );
        }

        return $query->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getRecentByCenter(int $centerId, int $limit = 50): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
