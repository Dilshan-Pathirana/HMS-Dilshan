<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\AttendanceRepositoryInterface;
use App\Models\Attendance;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class AttendanceRepository extends BaseRepository implements AttendanceRepositoryInterface
{
    public function __construct(Attendance $model)
    {
        parent::__construct($model);
    }

    public function getByEmployeeAndDate(int $employeeId, Carbon $date): ?Attendance
    {
        return $this->model->where('employee_id', $employeeId)
            ->where('attendance_date', $date->toDateString())
            ->first();
    }

    public function getByEmployeeDateRange(int $employeeId, Carbon $startDate, Carbon $endDate): Collection
    {
        return $this->model->where('employee_id', $employeeId)
            ->whereBetween('attendance_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('attendance_date', 'desc')
            ->get();
    }

    public function getByCenterAndDate(int $centerId, Carbon $date): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->where('attendance_date', $date->toDateString())
            ->with('employee')
            ->get();
    }

    public function checkIn(int $employeeId, int $centerId, Carbon $checkInTime): Attendance
    {
        return $this->model->create([
            'employee_id' => $employeeId,
            'center_id' => $centerId,
            'attendance_date' => $checkInTime->toDateString(),
            'check_in_time' => $checkInTime->toTimeString(),
            'status' => 'present'
        ]);
    }

    public function checkOut(int $attendanceId, Carbon $checkOutTime): bool
    {
        $attendance = $this->model->find($attendanceId);
        
        if (!$attendance) {
            return false;
        }

        $checkIn = Carbon::parse($attendance->attendance_date . ' ' . $attendance->check_in_time);
        $hoursWorked = $checkIn->diffInHours($checkOutTime, true);

        return $attendance->update([
            'check_out_time' => $checkOutTime->toTimeString(),
            'hours_worked' => round($hoursWorked, 2)
        ]);
    }

    public function getAbsentEmployees(int $centerId, Carbon $date): Collection
    {
        // This would need a User model query to get employees without attendance
        // For now, returning empty collection as placeholder
        return collect([]);
    }

    public function getTotalHours(int $employeeId, Carbon $startDate, Carbon $endDate): float
    {
        return $this->model->where('employee_id', $employeeId)
            ->whereBetween('attendance_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('hours_worked');
    }
}
