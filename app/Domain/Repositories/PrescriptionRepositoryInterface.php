<?php

namespace App\Domain\Repositories;

use App\Models\Prescription;
use Illuminate\Support\Collection;

interface PrescriptionRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get prescriptions by session
     */
    public function getBySession(int $sessionId): Collection;

    /**
     * Get undispensed prescriptions for patient
     */
    public function getUndispensedByPatient(int $patientId): Collection;

    /**
     * Get prescriptions by patient
     */
    public function getByPatient(int $patientId): Collection;

    /**
     * Mark prescription as dispensed
     */
    public function markAsDispensed(int $id, int $dispensedBy): bool;

    /**
     * Get prescriptions with medication details
     */
    public function findWithMedication(int $id): ?Prescription;

    /**
     * Get pending prescriptions for center
     */
    public function getPendingByCenter(int $centerId): Collection;
}
