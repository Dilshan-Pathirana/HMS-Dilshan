<?php

namespace App\Models\StaffSalary;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StaffSalary extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'staff_salary';

    protected $fillable = [
        'user_id',
        'branch_id',
        'basic_salary_amount',
        'allocation_amount',
        'rate_for_hour',
        'maximum_hours_can_work',
    ];
}
