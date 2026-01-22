<?php

namespace App\Models\Appointment;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorScheduleCancellation extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'doctor_schedule_cancellations';

    protected $fillable = [
        'schedule_id',
        'doctor_id',
        'branch_id',
        'date',
        'reason',
        'status',
        'reject_reason',
    ];
}
