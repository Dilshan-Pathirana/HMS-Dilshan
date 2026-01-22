<?php

namespace App\Domain\Repositories;

use App\Models\Appointment;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

interface AppointmentRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get appointments by status
     */
    public function getByStatus(string $status, int $centerId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get upcoming appointments for patient
     */
    public function getUpcomingByPatient(int $patientId): Collection;

    /**
     * Get appointments for doctor on specific date
     */
    public function getByDoctorAndDate(int $doctorId, Carbon $date): Collection;

    /**
     * Get today's appointments for doctor
     */
    public function getTodayByDoctor(int $doctorId): Collection;

    /**
     * Check if time slot is available
     */
    public function isTimeSlotAvailable(int $doctorId, Carbon $date, string $time): bool;

    /**
     * Get appointments within date range
     */
    public function getByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): Collection;

    /**
     * Get pending appointments (booked status)
     */
    public function getPending(int $centerId): Collection;

    /**
     * Find appointment with patient and doctor
     */
    public function findWithRelations(int $id): ?Appointment;

    /**
     * Get no-show appointments
     */
    public function getNoShows(int $centerId, Carbon $startDate, Carbon $endDate): Collection;
}
