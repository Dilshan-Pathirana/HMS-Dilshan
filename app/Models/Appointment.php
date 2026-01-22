<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'center_id',
        'appointment_date',
        'appointment_time',
        'appointment_type',
        'status',
        'booking_fee',
        'payment_status',
        'notes',
        'cancellation_reason',
        'checked_in_at',
        'canceled_at',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'booking_fee' => 'decimal:2',
        'checked_in_at' => 'datetime',
        'canceled_at' => 'datetime',
    ];

    /**
     * Get the patient for this appointment
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    /**
     * Get the doctor for this appointment
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the center for this appointment
     */
    public function center()
    {
        return $this->belongsTo(MedicalCenter::class, 'center_id');
    }

    /**
     * Get the session for this appointment
     */
    public function session()
    {
        return $this->hasOne(Session::class, 'appointment_id');
    }

    /**
     * Scope to get appointments by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get upcoming appointments
     */
    public function scopeUpcoming($query)
    {
        return $query->where('appointment_date', '>=', now()->toDateString())
                     ->whereIn('status', ['booked', 'checked_in']);
    }

    /**
     * Scope to get appointments for today
     */
    public function scopeToday($query)
    {
        return $query->where('appointment_date', now()->toDateString());
    }

    /**
     * Check if appointment is terminal (cannot be modified)
     */
    public function isTerminal()
    {
        return in_array($this->status, ['completed', 'canceled', 'no_show']);
    }
}
