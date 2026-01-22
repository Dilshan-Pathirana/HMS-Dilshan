<?php

namespace App\Domain\Repositories;

use App\Models\Patient;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PatientRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Find patient by registration number
     */
    public function findByRegistrationNumber(string $registrationNumber, int $centerId): ?Patient;

    /**
     * Find patient by NIC
     */
    public function findByNic(string $nic): ?Patient;

    /**
     * Search patients by name, phone, or registration number
     */
    public function search(string $term, int $centerId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get active patients for a medical center
     */
    public function getActiveByCenter(int $centerId): Collection;

    /**
     * Get patient with medical history
     */
    public function findWithMedicalHistory(int $id): ?Patient;

    /**
     * Get patients with upcoming appointments
     */
    public function getWithUpcomingAppointments(int $centerId): Collection;
}
