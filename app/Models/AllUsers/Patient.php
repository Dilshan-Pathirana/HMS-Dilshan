<?php

namespace App\Models\AllUsers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Patient extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'patients';

    protected $fillable = [
        'branch_id',
        'patient_id',
        'user_id',
        'first_name',
        'last_name',
        'phone',
        'nic',
        'email',
        'address',
        'city',
        'date_of_birth',
        'gender',
        'blood_type',
        'emergency_contact_name',
        'emergency_contact_phone',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];
}
