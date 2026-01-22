<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\DoctorScheduleRepositoryInterface;
use App\Models\DoctorSchedule;
use Illuminate\Support\Collection;

class DoctorScheduleRepository extends BaseRepository implements DoctorScheduleRepositoryInterface
{
    public function __construct(DoctorSchedule $model)
    {
        parent::__construct($model);
    }

    public function getByDoctorAndDay(int $doctorId, string $dayOfWeek): Collection
    {
        return $this->model->where('doctor_id', $doctorId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->get();
    }

    public function getActiveByDoctor(int $doctorId): Collection
    {
        return $this->model->where('doctor_id', $doctorId)
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();
    }

    public function isAvailable(int $doctorId, string $dayOfWeek, string $startTime, string $endTime): bool
    {
        return $this->model->where('doctor_id', $doctorId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->where(function($q) use ($startTime, $endTime) {
                $q->where(function($query) use ($startTime, $endTime) {
                    $query->where('start_time', '<=', $startTime)
                          ->where('end_time', '>=', $endTime);
                });
            })
            ->exists();
    }

    public function getActiveByCenterGroupedByDoctor(int $centerId): Collection
    {
        return $this->model->with('doctor')
            ->where('center_id', $centerId)
            ->where('is_active', true)
            ->get()
            ->groupBy('doctor_id');
    }

    public function findOverlapping(int $doctorId, string $dayOfWeek, string $startTime, string $endTime, ?int $excludeId = null): Collection
    {
        $query = $this->model->where('doctor_id', $doctorId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->where(function($q) use ($startTime, $endTime) {
                $q->whereBetween('start_time', [$startTime, $endTime])
                  ->orWhereBetween('end_time', [$startTime, $endTime])
                  ->orWhere(function($query) use ($startTime, $endTime) {
                      $query->where('start_time', '<=', $startTime)
                            ->where('end_time', '>=', $endTime);
                  });
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->get();
    }
}
