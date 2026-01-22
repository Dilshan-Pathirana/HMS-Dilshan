<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\PatientRepositoryInterface;
use App\Models\Patient;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class PatientRepository extends BaseRepository implements PatientRepositoryInterface
{
    public function __construct(Patient $model)
    {
        parent::__construct($model);
    }

    public function findByRegistrationNumber(string $registrationNumber, int $centerId): ?Patient
    {
        return $this->model->where('unique_registration_number', $registrationNumber)
            ->where('center_id', $centerId)
            ->first();
    }

    public function findByNic(string $nic): ?Patient
    {
        return $this->model->where('nic', $nic)->first();
    }

    public function search(string $term, int $centerId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->search($term)
            ->where('center_id', $centerId)
            ->paginate($perPage);
    }

    public function getActiveByCenter(int $centerId): Collection
    {
        return $this->model->active()
            ->where('center_id', $centerId)
            ->get();
    }

    public function findWithMedicalHistory(int $id): ?Patient
    {
        return $this->model->with(['appointments', 'sessions', 'prescriptions'])
            ->find($id);
    }

    public function getWithUpcomingAppointments(int $centerId): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->whereHas('appointments', function($q) {
                $q->where('appointment_date', '>=', now()->toDateString())
                  ->whereIn('status', ['booked', 'checked_in']);
            })
            ->with(['appointments' => function($q) {
                $q->where('appointment_date', '>=', now()->toDateString())
                  ->whereIn('status', ['booked', 'checked_in'])
                  ->orderBy('appointment_date')
                  ->orderBy('appointment_time');
            }])
            ->get();
    }
}
