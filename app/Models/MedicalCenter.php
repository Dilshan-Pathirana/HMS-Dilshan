<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MedicalCenter extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'center_name',
        'center_code',
        'address',
        'city',
        'state',
        'zip_code',
        'phone_number',
        'email',
        'license_number',
        'operating_hours',
        'latitude',
        'longitude',
        'tenant_admin_id',
        'is_active',
    ];

    protected $casts = [
        'operating_hours' => 'array',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'is_active' => 'boolean',
    ];

    /**
     * Get the tenant admin for this center
     */
    public function tenantAdmin()
    {
        return $this->belongsTo(User::class, 'tenant_admin_id');
    }

    /**
     * Get all users (staff) in this center
     */
    public function users()
    {
        return $this->hasMany(User::class, 'center_id');
    }

    /**
     * Get all patients in this center
     */
    public function patients()
    {
        return $this->hasMany(Patient::class, 'center_id');
    }

    /**
     * Get all appointments in this center
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'center_id');
    }

    /**
     * Get all sessions in this center
     */
    public function sessions()
    {
        return $this->hasMany(Session::class, 'center_id');
    }

    /**
     * Get all medications in this center
     */
    public function medications()
    {
        return $this->hasMany(Medication::class, 'center_id');
    }

    /**
     * Get all invoices in this center
     */
    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'center_id');
    }

    /**
     * Get all payroll records in this center
     */
    public function payrollRecords()
    {
        return $this->hasMany(Payroll::class, 'center_id');
    }

    /**
     * Scope to get only active centers
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get centers by city
     */
    public function scopeByCity($query, $city)
    {
        return $query->where('city', $city);
    }
}
