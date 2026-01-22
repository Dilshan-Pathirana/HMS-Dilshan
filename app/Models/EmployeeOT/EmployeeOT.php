<?php

namespace App\Models\EmployeeOT;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmployeeOT extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'employee_ot';

    protected $fillable = [
        'employee_id',
        'date',
        'hours_worked',
        'ot_rate',
        'total_ot_amount',
    ];
}
