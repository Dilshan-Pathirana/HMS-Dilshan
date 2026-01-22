<?php

namespace App\Models\AllUsers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Cashier extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'cashiers';

    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'branch_id',
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
        'qualifications',
        'years_of_experience',
        'joining_date',
        'contract_type',
        'employee_id',
        'contract_duration',
        'compensation_package',
    ];
}
