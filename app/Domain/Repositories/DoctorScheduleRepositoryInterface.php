<?php

namespace App\Domain\Repositories;

use App\Models\DoctorSchedule;
use Illuminate\Support\Collection;

interface DoctorScheduleRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get doctor schedules for specific day
     */
    public function getByDoctorAndDay(int $doctorId, string $dayOfWeek): Collection;

    /**
     * Get active schedules for doctor
     */
    public function getActiveByDoctor(int $doctorId): Collection;

    /**
     * Check if doctor is available at specific time
     */
    public function isAvailable(int $doctorId, string $dayOfWeek, string $startTime, string $endTime): bool;

    /**
     * Get all active schedules for a center
     */
    public function getActiveByCenterGroupedByDoctor(int $centerId): Collection;

    /**
     * Find overlapping schedules
     */
    public function findOverlapping(int $doctorId, string $dayOfWeek, string $startTime, string $endTime, ?int $excludeId = null): Collection;
}
