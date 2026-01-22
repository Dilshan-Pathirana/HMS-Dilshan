<?php

namespace App\Application\Services;

use App\Core\Exceptions\ResourceNotFoundException;
use Illuminate\Support\Facades\DB;

/**
 * Payroll Service
 * Handles employee salary calculations, payroll generation, and disbursements
 */
class PayrollService extends BaseService
{
    /**
     * Calculate employee salary for period
     */
    public function calculateSalary(int $employeeId, string $period): array
    {
        try {
            // Get employee details
            $employee = DB::table('users')->where('id', $employeeId)->first();

            if (!$employee) {
                throw new ResourceNotFoundException('Employee', $employeeId);
            }

            // Get base salary
            $baseSalary = $employee->base_salary ?? 0;

            // Calculate overtime
            $overtime = $this->calculateOvertime($employeeId, $period);

            // Calculate bonuses
            $bonuses = $this->calculateBonuses($employeeId, $period);

            // Calculate deductions
            $deductions = $this->calculateDeductions($employeeId, $period);

            // Calculate attendance allowance/deductions
            $attendanceAdjustment = $this->calculateAttendanceAdjustment($employeeId, $period);

            // Calculate net salary
            $grossSalary = $baseSalary + $overtime + $bonuses + $attendanceAdjustment;
            $netSalary = $grossSalary - $deductions;

            $this->log('info', 'Salary calculated', [
                'employee_id' => $employeeId,
                'period' => $period,
                'net_salary' => $netSalary,
            ]);

            return [
                'employee_id' => $employeeId,
                'employee_name' => "{$employee->first_name} {$employee->last_name}",
                'period' => $period,
                'base_salary' => $baseSalary,
                'overtime' => $overtime,
                'bonuses' => $bonuses,
                'deductions' => $deductions,
                'attendance_adjustment' => $attendanceAdjustment,
                'gross_salary' => $grossSalary,
                'net_salary' => $netSalary,
            ];

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Generate payroll for all employees in center
     */
    public function generatePayroll(string $centerId, string $period): array
    {
        try {
            $employees = DB::table('users')
                ->where('center_id', $centerId)
                ->where('is_active', true)
                ->whereIn('role', ['doctor', 'nurse', 'receptionist', 'pharmacist', 'cashier'])
                ->get();

            $payrollRecords = [];

            foreach ($employees as $employee) {
                $salary = $this->calculateSalary($employee->id, $period);

                $payrollId = DB::table('payroll')->insertGetId([
                    'employee_id' => $employee->id,
                    'center_id' => $centerId,
                    'period' => $period,
                    'base_salary' => $salary['base_salary'],
                    'overtime' => $salary['overtime'],
                    'bonuses' => $salary['bonuses'],
                    'deductions' => $salary['deductions'],
                    'attendance_adjustment' => $salary['attendance_adjustment'],
                    'gross_salary' => $salary['gross_salary'],
                    'net_salary' => $salary['net_salary'],
                    'status' => 'pending',
                    'generated_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $payrollRecords[] = array_merge($salary, ['payroll_id' => $payrollId]);
            }

            $this->log('info', 'Payroll generated', [
                'center_id' => $centerId,
                'period' => $period,
                'employee_count' => count($payrollRecords),
            ]);

            return [
                'center_id' => $centerId,
                'period' => $period,
                'total_employees' => count($payrollRecords),
                'total_amount' => array_sum(array_column($payrollRecords, 'net_salary')),
                'records' => $payrollRecords,
            ];

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Disburse salary payment
     */
    public function disburseSalary(int $payrollId, array $paymentData): array
    {
        try {
            $this->validateRequired($paymentData, ['payment_method']);

            $payroll = DB::table('payroll')->where('id', $payrollId)->first();

            if (!$payroll) {
                throw new ResourceNotFoundException('Payroll', $payrollId);
            }

            // Create disbursement record
            $disbursementId = DB::table('salary_disbursements')->insertGetId([
                'payroll_id' => $payrollId,
                'employee_id' => $payroll->employee_id,
                'amount' => $payroll->net_salary,
                'payment_method' => $paymentData['payment_method'],
                'transaction_id' => $paymentData['transaction_id'] ?? null,
                'disbursed_by' => $paymentData['disbursed_by'],
                'disbursement_date' => now(),
                'status' => 'completed',
                'notes' => $paymentData['notes'] ?? null,
                'created_at' => now(),
            ]);

            // Update payroll status
            DB::table('payroll')
                ->where('id', $payrollId)
                ->update([
                    'status' => 'disbursed',
                    'disbursed_at' => now(),
                    'updated_at' => now(),
                ]);

            $this->log('info', 'Salary disbursed', [
                'payroll_id' => $payrollId,
                'disbursement_id' => $disbursementId,
                'amount' => $payroll->net_salary,
            ]);

            return [
                'disbursement_id' => $disbursementId,
                'payroll_id' => $payrollId,
                'amount' => $payroll->net_salary,
                'payment_method' => $paymentData['payment_method'],
                'status' => 'completed',
            ];

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Calculate overtime for employee
     */
    private function calculateOvertime(int $employeeId, string $period): float
    {
        [$year, $month] = explode('-', $period);

        $overtimeHours = DB::table('attendance')
            ->where('employee_id', $employeeId)
            ->whereYear('attendance_date', $year)
            ->whereMonth('attendance_date', $month)
            ->sum('overtime_hours') ?? 0;

        // Get hourly rate (assuming stored in users table)
        $hourlyRate = DB::table('users')
            ->where('id', $employeeId)
            ->value('hourly_rate') ?? 0;

        // Overtime multiplier (1.5x)
        return $overtimeHours * $hourlyRate * 1.5;
    }

    /**
     * Calculate bonuses
     */
    private function calculateBonuses(int $employeeId, string $period): float
    {
        [$year, $month] = explode('-', $period);

        return DB::table('bonuses')
            ->where('employee_id', $employeeId)
            ->whereYear('bonus_date', $year)
            ->whereMonth('bonus_date', $month)
            ->sum('amount') ?? 0;
    }

    /**
     * Calculate deductions
     */
    private function calculateDeductions(int $employeeId, string $period): float
    {
        [$year, $month] = explode('-', $period);

        return DB::table('deductions')
            ->where('employee_id', $employeeId)
            ->whereYear('deduction_date', $year)
            ->whereMonth('deduction_date', $month)
            ->sum('amount') ?? 0;
    }

    /**
     * Calculate attendance adjustment
     */
    private function calculateAttendanceAdjustment(int $employeeId, string $period): float
    {
        [$year, $month] = explode('-', $period);

        $expectedDays = cal_days_in_month(CAL_GREGORIAN, (int)$month, (int)$year);
        
        $actualDays = DB::table('attendance')
            ->where('employee_id', $employeeId)
            ->whereYear('attendance_date', $year)
            ->whereMonth('attendance_date', $month)
            ->where('status', 'present')
            ->count();

        $absentDays = $expectedDays - $actualDays;

        if ($absentDays <= 0) {
            return 0; // Perfect attendance, no deduction
        }

        // Deduct daily rate for absent days
        $baseSalary = DB::table('users')
            ->where('id', $employeeId)
            ->value('base_salary') ?? 0;

        $dailyRate = $baseSalary / $expectedDays;

        return -($absentDays * $dailyRate);
    }

    /**
     * Get attendance report
     */
    public function getAttendanceReport(int $employeeId, string $period): array
    {
        [$year, $month] = explode('-', $period);

        $attendance = DB::table('attendance')
            ->where('employee_id', $employeeId)
            ->whereYear('attendance_date', $year)
            ->whereMonth('attendance_date', $month)
            ->orderBy('attendance_date')
            ->get();

        $summary = [
            'present' => $attendance->where('status', 'present')->count(),
            'absent' => $attendance->where('status', 'absent')->count(),
            'late' => $attendance->where('status', 'late')->count(),
            'half_day' => $attendance->where('status', 'half_day')->count(),
            'total_overtime_hours' => $attendance->sum('overtime_hours'),
        ];

        return [
            'employee_id' => $employeeId,
            'period' => $period,
            'summary' => $summary,
            'records' => $attendance->toArray(),
        ];
    }
}
