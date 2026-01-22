<?php

namespace App\Models\HRM;

use App\Models\Branch;
use App\Models\AllUsers\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'shift_definitions';

    protected $fillable = [
        'branch_id',
        'shift_name',
        'shift_code',
        'start_time',
        'end_time',
        'standard_hours',
        'break_duration',
        'overnight_shift',
        'is_active',
        'description',
        'applicable_roles',
        'applicable_days',
    ];

    protected $casts = [
        'standard_hours' => 'decimal:2',
        'break_duration' => 'decimal:2',
        'overnight_shift' => 'boolean',
        'is_active' => 'boolean',
        'applicable_roles' => 'array',
        'applicable_days' => 'array',
    ];

    /**
     * Get the branch that owns the shift template
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Scope for active shift templates
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for global shift templates (no branch)
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('branch_id');
    }

    /**
     * Scope for branch-specific shift templates
     */
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Get all available roles for shift assignment
     */
    public static function getAvailableRoles(): array
    {
        return [
            'doctor' => 'Doctor',
            'nurse' => 'Nurse',
            'pharmacist' => 'Pharmacist',
            'cashier' => 'Cashier',
            'receptionist' => 'Receptionist',
            'lab_technician' => 'Lab Technician',
            'radiologist' => 'Radiologist',
            'center_aid' => 'Center Aid',
            'it_support' => 'IT Support',
            'branch_admin' => 'Branch Admin',
        ];
    }

    /**
     * Get days of week
     */
    public static function getDaysOfWeek(): array
    {
        return [
            'monday' => 'Monday',
            'tuesday' => 'Tuesday',
            'wednesday' => 'Wednesday',
            'thursday' => 'Thursday',
            'friday' => 'Friday',
            'saturday' => 'Saturday',
            'sunday' => 'Sunday',
        ];
    }

    /**
     * Get Sri Lanka hospital default shift templates
     */
    public static function getSriLankaDefaults(): array
    {
        return [
            [
                'shift_name' => 'Morning Shift',
                'shift_code' => 'M',
                'start_time' => '06:00:00',
                'end_time' => '14:00:00',
                'standard_hours' => 8.00,
                'break_duration' => 0.50,
                'overnight_shift' => false,
                'is_active' => true,
                'description' => 'Standard morning shift for medical staff',
                'applicable_roles' => ['doctor', 'nurse', 'pharmacist', 'cashier', 'receptionist', 'lab_technician', 'center_aid'],
                'applicable_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            ],
            [
                'shift_name' => 'Afternoon Shift',
                'shift_code' => 'A',
                'start_time' => '14:00:00',
                'end_time' => '22:00:00',
                'standard_hours' => 8.00,
                'break_duration' => 0.50,
                'overnight_shift' => false,
                'is_active' => true,
                'description' => 'Standard afternoon/evening shift',
                'applicable_roles' => ['doctor', 'nurse', 'pharmacist', 'cashier', 'receptionist', 'lab_technician', 'center_aid'],
                'applicable_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            ],
            [
                'shift_name' => 'Night Shift',
                'shift_code' => 'N',
                'start_time' => '22:00:00',
                'end_time' => '06:00:00',
                'standard_hours' => 8.00,
                'break_duration' => 0.50,
                'overnight_shift' => true,
                'is_active' => true,
                'description' => 'Overnight shift - includes night duty allowance',
                'applicable_roles' => ['doctor', 'nurse', 'pharmacist', 'center_aid'],
                'applicable_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            ],
            [
                'shift_name' => 'Day Shift',
                'shift_code' => 'D',
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'standard_hours' => 8.00,
                'break_duration' => 1.00,
                'overnight_shift' => false,
                'is_active' => true,
                'description' => 'Standard office hours shift',
                'applicable_roles' => ['branch_admin', 'it_support', 'receptionist', 'cashier'],
                'applicable_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            ],
            [
                'shift_name' => 'Half Day Morning',
                'shift_code' => 'HM',
                'start_time' => '08:00:00',
                'end_time' => '13:00:00',
                'standard_hours' => 5.00,
                'break_duration' => 0.00,
                'overnight_shift' => false,
                'is_active' => true,
                'description' => 'Half day shift - morning session',
                'applicable_roles' => ['doctor', 'nurse', 'pharmacist', 'cashier', 'receptionist'],
                'applicable_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            ],
            [
                'shift_name' => 'Half Day Evening',
                'shift_code' => 'HE',
                'start_time' => '14:00:00',
                'end_time' => '19:00:00',
                'standard_hours' => 5.00,
                'break_duration' => 0.00,
                'overnight_shift' => false,
                'is_active' => true,
                'description' => 'Half day shift - evening session',
                'applicable_roles' => ['doctor', 'nurse', 'pharmacist', 'cashier', 'receptionist'],
                'applicable_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            ],
            [
                'shift_name' => 'OPD Morning',
                'shift_code' => 'OPD-M',
                'start_time' => '07:00:00',
                'end_time' => '13:00:00',
                'standard_hours' => 6.00,
                'break_duration' => 0.50,
                'overnight_shift' => false,
                'is_active' => true,
                'description' => 'Outpatient Department - Morning session',
                'applicable_roles' => ['doctor', 'nurse', 'receptionist'],
                'applicable_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            ],
            [
                'shift_name' => 'OPD Evening',
                'shift_code' => 'OPD-E',
                'start_time' => '16:00:00',
                'end_time' => '21:00:00',
                'standard_hours' => 5.00,
                'break_duration' => 0.00,
                'overnight_shift' => false,
                'is_active' => true,
                'description' => 'Outpatient Department - Evening session',
                'applicable_roles' => ['doctor', 'nurse', 'receptionist'],
                'applicable_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            ],
        ];
    }
}
