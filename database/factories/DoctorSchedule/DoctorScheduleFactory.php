<?php

namespace Database\Factories\DoctorSchedule;

use App\Models\AllUsers\User;
use App\Models\Hospital\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DoctorSchedule\DoctorSchedule>
 */
class DoctorScheduleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'doctor_id' => User::factory(),
            'branch_id' => Branch::factory(),
            'schedule_day' => $this->faker->randomElement(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
            'start_time' => $this->faker->time('H:i'),
            'max_patients' => $this->faker->numberBetween(5, 20),
        ];
    }
}
