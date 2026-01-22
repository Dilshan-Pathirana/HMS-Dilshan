<?php

namespace App\Models\DoctorCreatedDisease;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorCreatedDisease extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'doctor_created_diseases';

    protected $fillable = [
        'doctor_id',
        'disease_name',
        'description',
        'priority',
    ];
}
