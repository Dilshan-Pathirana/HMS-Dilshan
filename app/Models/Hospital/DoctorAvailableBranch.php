<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorAvailableBranch extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'doctor_available_branches';

    protected $fillable = [
        'user_id',
        'branch_id',
    ];
}
