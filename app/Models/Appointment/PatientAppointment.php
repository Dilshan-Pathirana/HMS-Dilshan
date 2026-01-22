<?php

namespace App\Models\Appointment;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PatientAppointment extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'patient_appointments';

    protected $fillable = [
        'user_id',
        'schedule_id',
        'doctor_id',
        'branch_id',
        'date',
        'slot',
        'reschedule_count',
        'status',
        'payment_status',
        'payment_id',
        'payment_amount',
        'payment_date',
    ];

    public static function findPatientAppointment(
        string $userId,
        string $appointmentDate,
        int $slot,
        string $doctorId,
        string $scheduleId
    ): ?self {
        return self::where('user_id', $userId)
            ->where('date', $appointmentDate)
            ->where('slot', $slot)
            ->where('doctor_id', $doctorId)
            ->where('schedule_id', $scheduleId)
            ->first();
    }
}
