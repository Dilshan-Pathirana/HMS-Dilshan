<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\AppointmentRepositoryInterface;
use App\Models\Appointment;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

class AppointmentRepository extends BaseRepository implements AppointmentRepositoryInterface
{
    public function __construct(Appointment $model)
    {
        parent::__construct($model);
    }

    public function getByStatus(string $status, int $centerId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->byStatus($status)
            ->where('center_id', $centerId)
            ->with(['patient', 'doctor'])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->paginate($perPage);
    }

    public function getUpcomingByPatient(int $patientId): Collection
    {
        return $this->model->upcoming()
            ->where('patient_id', $patientId)
            ->with('doctor')
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->get();
    }

    public function getByDoctorAndDate(int $doctorId, Carbon $date): Collection
    {
        return $this->model->where('doctor_id', $doctorId)
            ->where('appointment_date', $date->toDateString())
            ->with('patient')
            ->orderBy('appointment_time')
            ->get();
    }

    public function getTodayByDoctor(int $doctorId): Collection
    {
        return $this->model->today()
            ->where('doctor_id', $doctorId)
            ->with('patient')
            ->orderBy('appointment_time')
            ->get();
    }

    public function isTimeSlotAvailable(int $doctorId, Carbon $date, string $time): bool
    {
        return !$this->model->where('doctor_id', $doctorId)
            ->where('appointment_date', $date->toDateString())
            ->where('appointment_time', $time)
            ->whereNotIn('status', ['canceled', 'no_show'])
            ->exists();
    }

    public function getByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->with(['patient', 'doctor'])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->get();
    }

    public function getPending(int $centerId): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->where('status', 'booked')
            ->where('appointment_date', '>=', now()->toDateString())
            ->with(['patient', 'doctor'])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->get();
    }

    public function findWithRelations(int $id): ?Appointment
    {
        return $this->model->with(['patient', 'doctor', 'center', 'session'])
            ->find($id);
    }

    public function getNoShows(int $centerId, Carbon $startDate, Carbon $endDate): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->where('status', 'no_show')
            ->whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->with(['patient', 'doctor'])
            ->get();
    }
}
