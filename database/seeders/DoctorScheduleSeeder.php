<?php

namespace Database\Seeders;

use App\Models\DoctorSchedule\DoctorSchedule;
use App\Models\Hospital\Branch;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DoctorScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $doctors = DB::table('users')->where('role_as', 5)->pluck('id');
        $branches = Branch::all();

        if ($doctors->isEmpty() || $branches->isEmpty()) {
            $this->command->warn('No doctors or branches found. Please seed users and branches first.');
            return;
        }

        $scheduleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $startTimes = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];

        foreach ($doctors as $doctorId) {
            foreach ($branches->random(min(2, $branches->count())) as $branch) {
                foreach ($scheduleDays as $day) {
                    DoctorSchedule::create([
                        'doctor_id' => $doctorId,
                        'branch_id' => $branch->id,
                        'schedule_day' => $day,
                        'start_time' => $startTimes[array_rand($startTimes)],
                        'max_patients' => rand(5, 20),
                    ]);
                }
            }
        }

        $this->command->info('Doctor schedules seeded successfully!');
    }
}
