<?php

namespace App\Domain\Repositories;

use App\Models\ChangeLog;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

interface ChangeLogRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get change logs by entity
     */
    public function getByEntity(string $entityType, int $entityId): Collection;

    /**
     * Get change logs by user
     */
    public function getByUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get change logs by action
     */
    public function getByAction(string $action, int $centerId): Collection;

    /**
     * Get change logs within date range
     */
    public function getByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): Collection;

    /**
     * Search change logs
     */
    public function search(array $filters, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get recent changes for center
     */
    public function getRecentByCenter(int $centerId, int $limit = 50): Collection;
}
