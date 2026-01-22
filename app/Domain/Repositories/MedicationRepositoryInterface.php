<?php

namespace App\Domain\Repositories;

use App\Models\Medication;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface MedicationRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Search medications by name or generic name
     */
    public function search(string $term, int $centerId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get low stock medications
     */
    public function getLowStock(int $centerId): Collection;

    /**
     * Get medications expiring soon
     */
    public function getExpiringSoon(int $centerId, int $days = 30): Collection;

    /**
     * Find medication by name and center
     */
    public function findByName(string $name, int $centerId): ?Medication;

    /**
     * Get active medications for center
     */
    public function getActiveByCenter(int $centerId): Collection;

    /**
     * Update stock quantity
     */
    public function updateStock(int $id, int $quantity): bool;

    /**
     * Get medications with reorder alerts
     */
    public function getWithReorderAlerts(int $centerId): Collection;

    /**
     * Get inventory value by center
     */
    public function getInventoryValue(int $centerId): float;
}
