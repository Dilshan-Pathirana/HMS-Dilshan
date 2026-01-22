<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'date_of_birth',
        'gender',
        'address',
        'city',
        'state',
        'zip_code',
        'unique_registration_number',
        'center_id',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        'medical_history',
        'allergies',
        'blood_group',
        'is_active',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'medical_history' => 'array',
        'allergies' => 'array',
        'is_active' => 'boolean',
    ];

    protected $hidden = [
        'medical_history',
        'allergies',
    ];

    /**
     * Get the medical center this patient belongs to
     */
    public function center()
    {
        return $this->belongsTo(MedicalCenter::class, 'center_id');
    }

    /**
     * Get all appointments for this patient
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    /**
     * Get all sessions for this patient
     */
    public function sessions()
    {
        return $this->hasMany(Session::class, 'patient_id');
    }

    /**
     * Get all prescriptions for this patient
     */
    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'patient_id');
    }

    /**
     * Get all invoices for this patient
     */
    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'patient_id');
    }

    /**
     * Get all payments made by this patient
     */
    public function payments()
    {
        return $this->hasMany(Payment::class, 'patient_id');
    }

    /**
     * Get full name attribute
     */
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Get age from date of birth
     */
    public function getAgeAttribute()
    {
        return $this->date_of_birth ? $this->date_of_birth->age : null;
    }

    /**
     * Scope to get only active patients
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to search by name
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%")
              ->orWhere('unique_registration_number', 'like', "%{$search}%");
        });
    }
}
