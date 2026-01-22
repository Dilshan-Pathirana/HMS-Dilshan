<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * STEP 20: HRM Audit Log Model
 * Tracks all HR-related activities for compliance and security
 */
class HRMAuditLog extends Model
{
    use HasUuids;

    protected $table = 'hrm_audit_logs';

    protected $fillable = [
        'user_id',
        'target_user_id',
        'branch_id',
        'action_type',
        'entity_type',
        'entity_id',
        'old_values',
        'new_values',
        'description',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * User who performed the action
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'user_id');
    }

    /**
     * Affected employee (target of the action)
     */
    public function targetUser()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'target_user_id');
    }

    /**
     * Branch where action occurred
     */
    public function branch()
    {
        return $this->belongsTo(\App\Models\Branch::class, 'branch_id');
    }

    /**
     * Log an HRM action
     */
    public static function logAction(
        string $userId,
        string $actionType,
        string $entityType,
        ?string $entityId = null,
        ?string $targetUserId = null,
        ?string $branchId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): self {
        return self::create([
            'user_id' => $userId,
            'target_user_id' => $targetUserId,
            'branch_id' => $branchId,
            'action_type' => $actionType,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'description' => $description,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);
    }

    /**
     * Get action type display name
     */
    public static function getActionTypes(): array
    {
        return [
            'salary_change' => 'Salary Change',
            'salary_increment' => 'Salary Increment',
            'leave_approved' => 'Leave Approved',
            'leave_rejected' => 'Leave Rejected',
            'leave_cancelled' => 'Leave Cancelled',
            'payroll_generated' => 'Payroll Generated',
            'payroll_approved' => 'Payroll Approved',
            'shift_assigned' => 'Shift Assigned',
            'shift_changed' => 'Shift Changed',
            'attendance_recorded' => 'Attendance Recorded',
            'attendance_modified' => 'Attendance Modified',
            'overtime_recorded' => 'Overtime Recorded',
            'overtime_approved' => 'Overtime Approved',
            'deduction_added' => 'Deduction Added',
            'deduction_removed' => 'Deduction Removed',
            'letter_generated' => 'Letter Generated',
            'complaint_filed' => 'Complaint Filed',
            'complaint_resolved' => 'Complaint Resolved',
            'policy_created' => 'Policy Created',
            'policy_updated' => 'Policy Updated',
            'employee_created' => 'Employee Created',
            'employee_updated' => 'Employee Updated',
            'employee_terminated' => 'Employee Terminated',
            'config_changed' => 'Configuration Changed',
            'epf_etf_updated' => 'EPF/ETF Updated',
            'bulk_payroll' => 'Bulk Payroll Process',
            'data_export' => 'Data Export',
            'report_generated' => 'Report Generated',
        ];
    }

    /**
     * Get entity type display name
     */
    public static function getEntityTypes(): array
    {
        return [
            'user' => 'Employee',
            'leave' => 'Leave Request',
            'payroll' => 'Payroll',
            'payslip' => 'Payslip',
            'shift' => 'Shift',
            'attendance' => 'Attendance',
            'overtime' => 'Overtime',
            'deduction' => 'Deduction',
            'letter' => 'Letter',
            'complaint' => 'Complaint',
            'policy' => 'HR Policy',
            'salary_structure' => 'Salary Structure',
            'increment' => 'Salary Increment',
            'config' => 'Configuration',
            'epf_etf' => 'EPF/ETF',
            'leave_type' => 'Leave Type',
            'shift_template' => 'Shift Template',
        ];
    }
}
