<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AllUsers\User;
use App\Models\StaffSalary\StaffSalary;
use Illuminate\Support\Str;

class StaffSalarySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Salary ranges based on role (in LKR)
        $salaryRanges = [
            1 => ['min' => 150000, 'max' => 200000], // Super Admin
            2 => ['min' => 120000, 'max' => 150000], // Branch Admin
            3 => ['min' => 180000, 'max' => 300000], // Doctor
            4 => ['min' => 80000, 'max' => 120000],  // Pharmacist
            5 => ['min' => 60000, 'max' => 90000],   // Nurse
            7 => ['min' => 50000, 'max' => 70000],   // Cashier
            8 => ['min' => 70000, 'max' => 100000],  // Supplier/IT
            9 => ['min' => 60000, 'max' => 90000],   // IT Support
            10 => ['min' => 40000, 'max' => 60000],  // Center Aid
            11 => ['min' => 90000, 'max' => 130000], // Auditor
        ];

        // Get all active staff (excluding patients - role_as = 6)
        $staff = User::where('is_active', 1)
            ->where('role_as', '!=', 6)
            ->get();

        echo "Creating salary records for {$staff->count()} staff members...\n";

        foreach ($staff as $employee) {
            // Skip if salary already exists
            if (StaffSalary::where('user_id', $employee->id)->exists()) {
                continue;
            }

            // Skip if user has no branch_id (super admins might not have branches)
            if (!$employee->branch_id) {
                // Assign to first branch for super admins
                $firstBranch = \App\Models\Branch::first();
                if (!$firstBranch) {
                    echo "Warning: No branches found, skipping user {$employee->email}\n";
                    continue;
                }
                $employee->branch_id = $firstBranch->id;
            }

            // Get salary range for this role
            $range = $salaryRanges[$employee->role_as] ?? ['min' => 50000, 'max' => 80000];
            
            // Generate random basic salary within range
            $basicSalary = rand($range['min'], $range['max']);
            
            // Calculate hourly rate (assuming 160 working hours per month)
            $hourlyRate = round($basicSalary / 160, 2);
            
            // Create salary record
            StaffSalary::create([
                'id' => Str::uuid(),
                'user_id' => $employee->id,
                'branch_id' => $employee->branch_id,
                'basic_salary_amount' => $basicSalary,
                'allocation_amount' => rand(5000, 15000), // Allowances
                'rate_for_hour' => $hourlyRate,
                'maximum_hours_can_work' => 200, // Max OT hours per month
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $totalPayroll = StaffSalary::sum('basic_salary_amount');
        echo "✓ Salary records created successfully!\n";
        echo "Total Monthly Payroll: LKR " . number_format($totalPayroll, 2) . "\n";
    }
}
