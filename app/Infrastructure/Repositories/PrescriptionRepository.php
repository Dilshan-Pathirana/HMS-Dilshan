<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\PrescriptionRepositoryInterface;
use App\Models\Prescription;
use Illuminate\Support\Collection;

class PrescriptionRepository extends BaseRepository implements PrescriptionRepositoryInterface
{
    public function __construct(Prescription $model)
    {
        parent::__construct($model);
    }

    public function getBySession(int $sessionId): Collection
    {
        return $this->model->where('session_id', $sessionId)
            ->with('medication')
            ->get();
    }

    public function getUndispensedByPatient(int $patientId): Collection
    {
        return $this->model->where('patient_id', $patientId)
            ->where('is_dispensed', false)
            ->with(['medication', 'session', 'doctor'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getByPatient(int $patientId): Collection
    {
        return $this->model->where('patient_id', $patientId)
            ->with(['medication', 'doctor'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function markAsDispensed(int $id, int $dispensedBy): bool
    {
        return $this->model->find($id)->update([
            'is_dispensed' => true,
            'dispensed_at' => now(),
            'dispensed_by' => $dispensedBy
        ]);
    }

    public function findWithMedication(int $id): ?Prescription
    {
        return $this->model->with(['medication', 'patient', 'doctor', 'session'])
            ->find($id);
    }

    public function getPendingByCenter(int $centerId): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->where('is_dispensed', false)
            ->with(['patient', 'medication', 'doctor'])
            ->orderBy('created_at', 'asc')
            ->get();
    }
}
