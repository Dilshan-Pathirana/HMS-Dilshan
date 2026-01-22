<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientVitalSign extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'patient_id',
        'nurse_id',
        'branch_id',
        'temperature',
        'temperature_unit',
        'blood_pressure_systolic',
        'blood_pressure_diastolic',
        'pulse_rate',
        'respiration_rate',
        'oxygen_saturation',
        'weight',
        'height',
        'notes',
        'pain_level',
        'consciousness_level',
        'is_abnormal',
        'abnormal_flags',
        'recorded_at',
    ];

    protected $casts = [
        'temperature' => 'decimal:2',
        'weight' => 'decimal:2',
        'height' => 'decimal:2',
        'is_abnormal' => 'boolean',
        'abnormal_flags' => 'array',
        'recorded_at' => 'datetime',
    ];

    /**
     * Get the patient
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the nurse who recorded this
     */
    public function nurse(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nurse_id');
    }

    /**
     * Get the branch
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(MedicalCenter::class, 'branch_id');
    }

    /**
     * Scope to filter by branch
     */
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Scope to filter by nurse
     */
    public function scopeForNurse($query, $nurseId)
    {
        return $query->where('nurse_id', $nurseId);
    }

    /**
     * Scope to filter by patient
     */
    public function scopeForPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    /**
     * Check if vital signs are within normal range
     */
    public function checkAbnormalities(): array
    {
        $abnormalities = [];

        // Temperature check (normal: 97.8 - 99.1°F)
        if ($this->temperature && $this->temperature_unit === 'F') {
            if ($this->temperature < 97.8 || $this->temperature > 99.1) {
                $abnormalities['temperature'] = $this->temperature < 97.8 ? 'low' : 'high';
            }
        }

        // Blood pressure check (normal: systolic 90-120, diastolic 60-80)
        if ($this->blood_pressure_systolic) {
            if ($this->blood_pressure_systolic < 90 || $this->blood_pressure_systolic > 140) {
                $abnormalities['blood_pressure_systolic'] = $this->blood_pressure_systolic < 90 ? 'low' : 'high';
            }
        }
        if ($this->blood_pressure_diastolic) {
            if ($this->blood_pressure_diastolic < 60 || $this->blood_pressure_diastolic > 90) {
                $abnormalities['blood_pressure_diastolic'] = $this->blood_pressure_diastolic < 60 ? 'low' : 'high';
            }
        }

        // Pulse rate check (normal: 60-100 bpm)
        if ($this->pulse_rate) {
            if ($this->pulse_rate < 60 || $this->pulse_rate > 100) {
                $abnormalities['pulse_rate'] = $this->pulse_rate < 60 ? 'low' : 'high';
            }
        }

        // Respiration rate check (normal: 12-20 breaths/min)
        if ($this->respiration_rate) {
            if ($this->respiration_rate < 12 || $this->respiration_rate > 20) {
                $abnormalities['respiration_rate'] = $this->respiration_rate < 12 ? 'low' : 'high';
            }
        }

        // Oxygen saturation check (normal: 95-100%)
        if ($this->oxygen_saturation) {
            if ($this->oxygen_saturation < 95) {
                $abnormalities['oxygen_saturation'] = 'low';
            }
        }

        return $abnormalities;
    }
}
