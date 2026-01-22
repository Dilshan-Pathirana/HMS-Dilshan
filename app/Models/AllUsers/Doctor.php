<?php

namespace App\Models\AllUsers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Doctor extends Model
{
    use HasFactory, HasUuids;
    protected $table = 'doctors';
    public $incrementing = false;
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'date_of_birth',
        'gender',
        'nic_number',
        'contact_number_mobile',
        'contact_number_landline',
        'email',
        'home_address',
        'emergency_contact_info',
        'photo',
        'nic_photo',
        'medical_registration_number',
        'qualifications',
        'years_of_experience',
        'areas_of_specialization',
        'previous_employment',
        'license_validity_date',
        'joining_date',
        'employee_id',
        'contract_type',
        'contract_duration',
        'probation_start_date',
        'probation_end_date',
        'compensation_package',
    ];
}
