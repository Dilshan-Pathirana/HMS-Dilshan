<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'patient_id',
        'doctor_id',
        'center_id',
        'session_date',
        'session_time',
        'diagnosis',
        'observations',
        'session_notes',
        'consultation_fee',
        'status',
        'ended_at',
    ];

    protected $casts = [
        'session_date' => 'date',
        'observations' => 'array',
        'consultation_fee' => 'decimal:2',
        'ended_at' => 'datetime',
    ];

    /**
     * Get the appointment for this session
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    /**
     * Get the patient for this session
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    /**
     * Get the doctor for this session
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the center for this session
     */
    public function center()
    {
        return $this->belongsTo(MedicalCenter::class, 'center_id');
    }

    /**
     * Get all prescriptions for this session
     */
    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'session_id');
    }

    /**
     * Get all media files for this session
     */
    public function media()
    {
        return $this->hasMany(SessionMedia::class, 'session_id');
    }

    /**
     * Get the invoice for this session
     */
    public function invoice()
    {
        return $this->hasOne(Invoice::class, 'session_id');
    }

    /**
     * Scope to get ongoing sessions
     */
    public function scopeOngoing($query)
    {
        return $query->where('status', 'ongoing');
    }

    /**
     * Scope to get completed sessions
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope to get sessions by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('session_date', [$startDate, $endDate]);
    }
}
