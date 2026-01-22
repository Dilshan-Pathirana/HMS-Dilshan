<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\MedicationRepositoryInterface;
use App\Models\Medication;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class MedicationRepository extends BaseRepository implements MedicationRepositoryInterface
{
    public function __construct(Medication $model)
    {
        parent::__construct($model);
    }

    public function search(string $term, int $centerId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('center_id', $centerId)
            ->where(function($q) use ($term) {
                $q->where('medication_name', 'like', "%{$term}%")
                  ->orWhere('generic_name', 'like', "%{$term}%")
                  ->orWhere('brand_name', 'like', "%{$term}%");
            })
            ->paginate($perPage);
    }

    public function getLowStock(int $centerId): Collection
    {
        return $this->model->lowStock()
            ->where('center_id', $centerId)
            ->orderBy('quantity_in_stock')
            ->get();
    }

    public function getExpiringSoon(int $centerId, int $days = 30): Collection
    {
        return $this->model->expiring($days)
            ->where('center_id', $centerId)
            ->orderBy('expiration_date')
            ->get();
    }

    public function findByName(string $name, int $centerId): ?Medication
    {
        return $this->model->where('medication_name', $name)
            ->where('center_id', $centerId)
            ->first();
    }

    public function getActiveByCenter(int $centerId): Collection
    {
        return $this->model->active()
            ->where('center_id', $centerId)
            ->orderBy('medication_name')
            ->get();
    }

    public function updateStock(int $id, int $quantity): bool
    {
        return $this->model->find($id)->update(['quantity_in_stock' => $quantity]);
    }

    public function getWithReorderAlerts(int $centerId): Collection
    {
        return $this->model->lowStock()
            ->where('center_id', $centerId)
            ->with('reorderAlerts')
            ->get();
    }

    public function getInventoryValue(int $centerId): float
    {
        return $this->model->where('center_id', $centerId)
            ->selectRaw('SUM(quantity_in_stock * price_per_unit) as total')
            ->value('total') ?? 0.0;
    }
}
