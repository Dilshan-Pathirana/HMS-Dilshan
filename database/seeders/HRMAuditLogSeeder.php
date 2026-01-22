<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HRMAuditLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeds sample HRM audit logs for all branches
     */
    public function run(): void
    {
        // Get branches
        $branches = DB::table('branches')->select('id', 'center_name')->get();
        
        if ($branches->isEmpty()) {
            $this->command->info('No branches found. Skipping HRM audit log seeding.');
            return;
        }

        // Get users for each branch
        $users = DB::table('users')
            ->whereNotNull('branch_id')
            ->where('is_active', 1)
            ->select('id', 'name', 'email', 'role_as', 'branch_id')
            ->get()
            ->groupBy('branch_id');

        // Get super admin
        $superAdmin = DB::table('users')
            ->where('role_as', 1) // super_admin role_as = 1
            ->first();

        if (!$superAdmin) {
            $this->command->info('No super admin found. Skipping HRM audit log seeding.');
            return;
        }

        $actionTypes = [
            'salary_change' => 'Updated salary for employee',
            'salary_increment' => 'Approved salary increment',
            'leave_approved' => 'Approved leave request',
            'leave_rejected' => 'Rejected leave request',
            'payroll_generated' => 'Generated monthly payroll',
            'shift_assigned' => 'Assigned shift to employee',
            'attendance_recorded' => 'Recorded attendance',
            'overtime_recorded' => 'Recorded overtime hours',
            'deduction_added' => 'Added deduction for employee',
            'employee_created' => 'Created new employee record',
            'employee_updated' => 'Updated employee profile',
            'config_changed' => 'Updated HRM configuration',
            'policy_created' => 'Created new HR policy',
            'policy_updated' => 'Updated HR policy',
            'epf_etf_updated' => 'Updated EPF/ETF configuration',
            'report_generated' => 'Generated HR report',
        ];

        $entityTypes = [
            'salary_change' => 'user',
            'salary_increment' => 'increment',
            'leave_approved' => 'leave',
            'leave_rejected' => 'leave',
            'payroll_generated' => 'payroll',
            'shift_assigned' => 'shift',
            'attendance_recorded' => 'attendance',
            'overtime_recorded' => 'overtime',
            'deduction_added' => 'deduction',
            'employee_created' => 'user',
            'employee_updated' => 'user',
            'config_changed' => 'config',
            'policy_created' => 'policy',
            'policy_updated' => 'policy',
            'epf_etf_updated' => 'epf_etf',
            'report_generated' => 'report',
        ];

        $logs = [];
        $now = now();

        // Generate logs for each branch
        foreach ($branches as $branch) {
            $branchUsers = $users->get($branch->id, collect());
            
            if ($branchUsers->isEmpty()) {
                continue;
            }

            // Generate 10-20 random logs per branch
            $logCount = rand(10, 20);
            
            for ($i = 0; $i < $logCount; $i++) {
                $actionType = array_rand($actionTypes);
                $targetUser = $branchUsers->random();
                $performer = rand(0, 1) ? $superAdmin : $branchUsers->random();
                
                $daysAgo = rand(0, 30);
                $hoursAgo = rand(0, 23);
                $createdAt = $now->copy()->subDays($daysAgo)->subHours($hoursAgo);

                $oldValues = null;
                $newValues = null;

                // Generate sample old/new values for certain action types
                if ($actionType === 'salary_change') {
                    $oldSalary = rand(30000, 80000);
                    $newSalary = $oldSalary + rand(5000, 15000);
                    $oldValues = json_encode(['basic_salary' => $oldSalary]);
                    $newValues = json_encode(['basic_salary' => $newSalary]);
                } elseif ($actionType === 'leave_approved' || $actionType === 'leave_rejected') {
                    $oldValues = json_encode(['status' => 'pending']);
                    $newValues = json_encode(['status' => $actionType === 'leave_approved' ? 'approved' : 'rejected']);
                } elseif ($actionType === 'shift_assigned') {
                    $newValues = json_encode(['shift' => ['Morning', 'Evening', 'Night'][rand(0, 2)], 'date' => $createdAt->format('Y-m-d')]);
                } elseif ($actionType === 'attendance_recorded') {
                    $newValues = json_encode(['status' => 'present', 'check_in' => '08:30', 'check_out' => '17:30']);
                } elseif ($actionType === 'overtime_recorded') {
                    $newValues = json_encode(['hours' => rand(1, 4), 'rate' => 1.5]);
                } elseif ($actionType === 'config_changed') {
                    $oldValues = json_encode(['pay_period' => 'monthly']);
                    $newValues = json_encode(['pay_period' => 'bi-weekly']);
                }

                $logs[] = [
                    'id' => Str::uuid()->toString(),
                    'user_id' => $performer->id,
                    'target_user_id' => in_array($actionType, ['config_changed', 'policy_created', 'policy_updated', 'epf_etf_updated', 'report_generated', 'payroll_generated']) 
                        ? null 
                        : $targetUser->id,
                    'branch_id' => $branch->id,
                    'action_type' => $actionType,
                    'entity_type' => $entityTypes[$actionType],
                    'entity_id' => Str::uuid()->toString(),
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'description' => $actionTypes[$actionType] . ($targetUser ? ' - ' . $targetUser->name : ''),
                    'ip_address' => '192.168.1.' . rand(1, 255),
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
            }
        }

        // Also add some super admin level actions (across all branches)
        $superAdminActions = [
            ['action_type' => 'config_changed', 'description' => 'Updated global payroll configuration'],
            ['action_type' => 'epf_etf_updated', 'description' => 'Updated EPF/ETF rates for all branches'],
            ['action_type' => 'policy_created', 'description' => 'Created company-wide leave policy'],
            ['action_type' => 'report_generated', 'description' => 'Generated monthly HR report for all branches'],
            ['action_type' => 'payroll_generated', 'description' => 'Processed bulk payroll for December 2025'],
        ];

        foreach ($superAdminActions as $idx => $action) {
            $createdAt = $now->copy()->subDays($idx)->subHours(rand(0, 12));
            $logs[] = [
                'id' => Str::uuid()->toString(),
                'user_id' => $superAdmin->id,
                'target_user_id' => null,
                'branch_id' => null, // Global action
                'action_type' => $action['action_type'],
                'entity_type' => $entityTypes[$action['action_type']],
                'entity_id' => Str::uuid()->toString(),
                'old_values' => null,
                'new_values' => json_encode(['timestamp' => $createdAt->toISOString()]),
                'description' => $action['description'],
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];
        }

        // Insert in chunks
        foreach (array_chunk($logs, 50) as $chunk) {
            DB::table('hrm_audit_logs')->insert($chunk);
        }

        $this->command->info('Created ' . count($logs) . ' HRM audit log entries across ' . $branches->count() . ' branches.');
    }
}
