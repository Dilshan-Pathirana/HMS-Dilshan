<?php

namespace App\Models\StaffSalary;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmployeeBankDetails extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'employee_bank_details';

    protected $fillable = [
        'user_id',
        'bank_name',
        'branch_name',
        'branch_code',
        'account_number',
        'account_owner_name',
    ];
}
