<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DispensingRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id',
        'patient_id',
        'medication_id',
        'quantity_dispensed',
        'dispensed_by',
        'dispense_date',
        'notes',
    ];

    protected $casts = [
        'quantity_dispensed' => 'integer',
        'dispense_date' => 'datetime',
    ];

    /**
     * Get the prescription
     */
    public function prescription()
    {
        return $this->belongsTo(Prescription::class, 'prescription_id');
    }

    /**
     * Get the patient
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    /**
     * Get the medication
     */
    public function medication()
    {
        return $this->belongsTo(Medication::class, 'medication_id');
    }

    /**
     * Get the pharmacist who dispensed
     */
    public function pharmacist()
    {
        return $this->belongsTo(User::class, 'dispensed_by');
    }

    /**
     * Scope to get records by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('dispense_date', [$startDate, $endDate]);
    }
}
