<?php

namespace App\Models\HRM;

use App\Models\Branch;
use App\Models\AllUsers\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveType extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'leave_types';

    protected $fillable = [
        'branch_id',
        'name',
        'code',
        'description',
        'default_days',
        'is_paid',
        'carry_forward',
        'max_carry_forward_days',
        'requires_approval',
        'min_days_notice',
        'max_consecutive_days',
        'eligibility',
        'min_service_months',
        'requires_document',
        'document_type',
        'deduction_rate',
        'affects_attendance',
        'color',
        'icon',
        'sort_order',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'default_days' => 'integer',
        'is_paid' => 'boolean',
        'carry_forward' => 'boolean',
        'max_carry_forward_days' => 'integer',
        'requires_approval' => 'boolean',
        'min_days_notice' => 'integer',
        'max_consecutive_days' => 'integer',
        'min_service_months' => 'integer',
        'requires_document' => 'boolean',
        'deduction_rate' => 'decimal:2',
        'affects_attendance' => 'boolean',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the branch that owns the leave type
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the user who created this leave type
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this leave type
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope for active leave types
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for global leave types (no branch)
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('branch_id');
    }

    /**
     * Scope for branch-specific leave types
     */
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Get Sri Lanka default leave types
     */
    public static function getSriLankaDefaults(): array
    {
        return [
            [
                'code' => 'annual',
                'name' => 'Annual Leave',
                'description' => 'Paid annual leave as per Shop and Office Employees Act',
                'default_days' => 14,
                'is_paid' => true,
                'carry_forward' => true,
                'max_carry_forward_days' => 7,
                'requires_approval' => true,
                'min_days_notice' => 7,
                'eligibility' => 'all',
                'min_service_months' => 12,
                'color' => '#3B82F6',
                'icon' => 'calendar',
                'sort_order' => 1,
            ],
            [
                'code' => 'casual',
                'name' => 'Casual Leave',
                'description' => 'Short-term personal leave for urgent matters',
                'default_days' => 7,
                'is_paid' => true,
                'carry_forward' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 1,
                'max_consecutive_days' => 3,
                'eligibility' => 'all',
                'min_service_months' => 0,
                'color' => '#10B981',
                'icon' => 'clock',
                'sort_order' => 2,
            ],
            [
                'code' => 'sick',
                'name' => 'Sick Leave',
                'description' => 'Medical leave with doctor certificate for extended illness',
                'default_days' => 7,
                'is_paid' => true,
                'carry_forward' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 0,
                'eligibility' => 'all',
                'min_service_months' => 0,
                'requires_document' => true,
                'document_type' => 'medical_certificate',
                'color' => '#EF4444',
                'icon' => 'heart-pulse',
                'sort_order' => 3,
            ],
            [
                'code' => 'maternity',
                'name' => 'Maternity Leave',
                'description' => 'Paid maternity leave as per Maternity Benefits Ordinance',
                'default_days' => 84,
                'is_paid' => true,
                'carry_forward' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 30,
                'eligibility' => 'female',
                'min_service_months' => 0,
                'requires_document' => true,
                'document_type' => 'medical_certificate',
                'color' => '#EC4899',
                'icon' => 'baby',
                'sort_order' => 4,
            ],
            [
                'code' => 'paternity',
                'name' => 'Paternity Leave',
                'description' => 'Paid leave for fathers after childbirth',
                'default_days' => 3,
                'is_paid' => true,
                'carry_forward' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 7,
                'eligibility' => 'male',
                'min_service_months' => 0,
                'requires_document' => true,
                'document_type' => 'birth_certificate',
                'color' => '#8B5CF6',
                'icon' => 'baby',
                'sort_order' => 5,
            ],
            [
                'code' => 'no_pay',
                'name' => 'No Pay Leave',
                'description' => 'Unpaid leave for personal reasons',
                'default_days' => 30,
                'is_paid' => false,
                'carry_forward' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 14,
                'eligibility' => 'all',
                'min_service_months' => 6,
                'deduction_rate' => 100,
                'color' => '#6B7280',
                'icon' => 'calendar-x',
                'sort_order' => 6,
            ],
            [
                'code' => 'bereavement',
                'name' => 'Bereavement Leave',
                'description' => 'Compassionate leave for death of immediate family member',
                'default_days' => 3,
                'is_paid' => true,
                'carry_forward' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 0,
                'eligibility' => 'all',
                'min_service_months' => 0,
                'color' => '#374151',
                'icon' => 'heart',
                'sort_order' => 7,
            ],
            [
                'code' => 'duty',
                'name' => 'Duty Leave',
                'description' => 'Leave for official duties like training, conferences',
                'default_days' => 10,
                'is_paid' => true,
                'carry_forward' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 3,
                'eligibility' => 'all',
                'min_service_months' => 3,
                'color' => '#F59E0B',
                'icon' => 'briefcase',
                'sort_order' => 8,
            ],
        ];
    }
}
