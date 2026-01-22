<?php

namespace App\Models\Appointment;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorAppointment extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'doctor_appointments';

    protected $fillable = [
        'doctor_id',
        'appointment_date',
        'booking_number',
    ];
}
