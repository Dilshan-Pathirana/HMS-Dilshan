<?php

namespace Database\Factories\Appointment;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Appointment\DoctorScheduleCancellation>
 */
class DoctorScheduleCancellationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'schedule_id' => Str::uuid(),
            'doctor_id' => Str::uuid(),
            'branch_id' => Str::uuid(),
            'date' => $this->faker->date(),
            'reason' => $this->faker->sentence(),
            'status' => $this->faker->randomElement([0, 1, 2]),
            'reject_reason' => $this->faker->optional()->sentence(),
        ];
    }
}
