<?php

namespace App\Models\StaffSalary;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StaffSalaryPay extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'staff_salary_pay';

    protected $fillable = [
        'user_id',
        'branch_id',
        'paid_salary_amount',
        'month',
        'status',
    ];
}
