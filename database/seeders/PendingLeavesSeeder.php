<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PendingLeavesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some random staff members
        $staff = DB::table('users')
            ->where('is_active', 1)
            ->where('role_as', '!=', 6)
            ->inRandomOrder()
            ->limit(15)
            ->get();

        echo "Creating pending leave requests for demonstration...\n";

        $leaveReasons = [
            'Medical leave - Doctor appointment',
            'Family emergency',
            'Personal matter',
            'Child sick leave',
            'Annual leave',
            'Medical checkup',
            'Wedding attendance',
            'Funeral attendance',
            'Home renovation work',
            'Vehicle maintenance'
        ];

        $count = 0;
        foreach ($staff as $employee) {
            // Create 1-2 pending leave requests per employee
            $numRequests = rand(1, 2);
            
            for ($i = 0; $i < $numRequests; $i++) {
                $startDate = Carbon::now()->addDays(rand(1, 30));
                $leaveDays = rand(1, 5);
                $endDate = $startDate->copy()->addDays($leaveDays - 1);

                DB::table('leaves_management')->insert([
                    'id' => Str::uuid(),
                    'user_id' => $employee->id,
                    'leaves_start_date' => $startDate->format('Y-m-d'),
                    'leaves_end_date' => $endDate->format('Y-m-d'),
                    'leaves_days' => $leaveDays,
                    'reason' => $leaveReasons[array_rand($leaveReasons)],
                    'status' => 'Pending',
                    'created_at' => Carbon::now()->subDays(rand(1, 10)),
                    'updated_at' => Carbon::now()->subDays(rand(1, 10)),
                ]);
                $count++;
            }
        }

        echo "✓ Created {$count} pending leave requests\n";
    }
}
