<?php

namespace App\Domain\Repositories;

use App\Models\Session;
use Illuminate\Support\Collection;
use Carbon\Carbon;

interface SessionRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Find session by appointment ID
     */
    public function findByAppointment(int $appointmentId): ?Session;

    /**
     * Get ongoing sessions for doctor
     */
    public function getOngoingByDoctor(int $doctorId): Collection;

    /**
     * Get completed sessions for patient
     */
    public function getCompletedByPatient(int $patientId): Collection;

    /**
     * Get sessions within date range
     */
    public function getByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): Collection;

    /**
     * Get session with prescriptions and media
     */
    public function findWithDetails(int $id): ?Session;

    /**
     * Get sessions for doctor with patient info
     */
    public function getByDoctorWithPatient(int $doctorId, int $perPage = 15);

    /**
     * Get sessions requiring follow-up
     */
    public function getRequiringFollowup(int $centerId): Collection;
}
