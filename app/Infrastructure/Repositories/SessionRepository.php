<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\SessionRepositoryInterface;
use App\Models\Session;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class SessionRepository extends BaseRepository implements SessionRepositoryInterface
{
    public function __construct(Session $model)
    {
        parent::__construct($model);
    }

    public function findByAppointment(int $appointmentId): ?Session
    {
        return $this->model->where('appointment_id', $appointmentId)->first();
    }

    public function getOngoingByDoctor(int $doctorId): Collection
    {
        return $this->model->ongoing()
            ->where('doctor_id', $doctorId)
            ->with('patient')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getCompletedByPatient(int $patientId): Collection
    {
        return $this->model->completed()
            ->where('patient_id', $patientId)
            ->with('doctor')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): Collection
    {
        return $this->model->dateRange($startDate, $endDate)
            ->where('center_id', $centerId)
            ->with(['patient', 'doctor'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findWithDetails(int $id): ?Session
    {
        return $this->model->with([
            'patient',
            'doctor',
            'appointment',
            'prescriptions.medication',
            'media',
            'invoice'
        ])->find($id);
    }

    public function getByDoctorWithPatient(int $doctorId, int $perPage = 15)
    {
        return $this->model->where('doctor_id', $doctorId)
            ->with(['patient', 'appointment'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getRequiringFollowup(int $centerId): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->where('status', 'completed')
            ->whereNotNull('follow_up_date')
            ->where('follow_up_date', '>=', now()->toDateString())
            ->with(['patient', 'doctor'])
            ->orderBy('follow_up_date')
            ->get();
    }
}
