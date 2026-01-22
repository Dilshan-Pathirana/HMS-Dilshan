<?php

namespace App\Models\DoctorSchedule;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorSchedule extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'doctor_schedules';

    protected $fillable = [
        'doctor_id',
        'branch_id',
        'schedule_day',
        'start_time',
        'end_time',
        'max_patients',
        'time_per_patient',
        'status',
    ];

    /**
     * Get the branch for this schedule
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
