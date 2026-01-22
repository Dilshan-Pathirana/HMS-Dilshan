<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\MedicalCenterRepositoryInterface;
use App\Models\MedicalCenter;
use Illuminate\Support\Collection;

class MedicalCenterRepository extends BaseRepository implements MedicalCenterRepositoryInterface
{
    public function __construct(MedicalCenter $model)
    {
        parent::__construct($model);
    }

    public function findByCode(string $code): ?MedicalCenter
    {
        return $this->model->where('center_code', $code)->first();
    }

    public function getActive(): Collection
    {
        return $this->model->active()->get();
    }

    public function getByCity(string $city): Collection
    {
        return $this->model->byCity($city)->get();
    }

    public function findWithAdmin(int $id): ?MedicalCenter
    {
        return $this->model->with('tenantAdmin')->find($id);
    }

    public function getWithStats(): Collection
    {
        return $this->model->with([
            'users' => fn($q) => $q->select('id', 'center_id', 'role'),
            'patients' => fn($q) => $q->select('id', 'center_id')
        ])->withCount(['users', 'patients', 'appointments', 'sessions'])
        ->get();
    }
}
