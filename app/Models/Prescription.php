<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'patient_id',
        'doctor_id',
        'medication_id',
        'dosage',
        'frequency',
        'duration',
        'notes',
        'is_dispensed',
    ];

    protected $casts = [
        'duration' => 'integer',
        'is_dispensed' => 'boolean',
    ];

    /**
     * Get the session for this prescription
     */
    public function session()
    {
        return $this->belongsTo(Session::class, 'session_id');
    }

    /**
     * Get the patient for this prescription
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    /**
     * Get the doctor who prescribed
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the medication
     */
    public function medication()
    {
        return $this->belongsTo(Medication::class, 'medication_id');
    }

    /**
     * Get the dispensing record
     */
    public function dispensingRecord()
    {
        return $this->hasOne(DispensingRecord::class, 'prescription_id');
    }

    /**
     * Scope to get pending prescriptions
     */
    public function scopePending($query)
    {
        return $query->where('is_dispensed', false);
    }

    /**
     * Scope to get dispensed prescriptions
     */
    public function scopeDispensed($query)
    {
        return $query->where('is_dispensed', true);
    }
}
