<?php

namespace App\Domain\Repositories;

use App\Models\Attendance;
use Illuminate\Support\Collection;
use Carbon\Carbon;

interface AttendanceRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get attendance for employee on specific date
     */
    public function getByEmployeeAndDate(int $employeeId, Carbon $date): ?Attendance;

    /**
     * Get attendance for employee in date range
     */
    public function getByEmployeeDateRange(int $employeeId, Carbon $startDate, Carbon $endDate): Collection;

    /**
     * Get attendance for center on specific date
     */
    public function getByCenterAndDate(int $centerId, Carbon $date): Collection;

    /**
     * Mark check-in
     */
    public function checkIn(int $employeeId, int $centerId, Carbon $checkInTime): Attendance;

    /**
     * Mark check-out
     */
    public function checkOut(int $attendanceId, Carbon $checkOutTime): bool;

    /**
     * Get absent employees for date
     */
    public function getAbsentEmployees(int $centerId, Carbon $date): Collection;

    /**
     * Calculate total hours worked
     */
    public function getTotalHours(int $employeeId, Carbon $startDate, Carbon $endDate): float;
}
