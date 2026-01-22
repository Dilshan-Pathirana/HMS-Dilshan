<?php

namespace App\Models\DoctorSession;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorSession extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'doctor_sessions';

    protected $fillable = [
        'branch_id',
        'doctor_id',
        'patient_id',
    ];
}
