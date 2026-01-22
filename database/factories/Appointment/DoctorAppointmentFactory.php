<?php

namespace Database\Factories\Appointment;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Appointment\DoctorAppointment>
 */
class DoctorAppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'doctor_id' => Str::uuid()->toString(),
            'appointment_date' => $this->faker->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
            'booking_number' => $this->faker->numberBetween(1, 100),
        ];
    }
}
