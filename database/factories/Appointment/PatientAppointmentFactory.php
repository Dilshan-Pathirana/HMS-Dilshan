<?php

namespace Database\Factories\Appointment;

use Illuminate\Support\Str;
use App\Models\DoctorSchedule\DoctorSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PatientAppointment>
 */
class PatientAppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'schedule_id' => DoctorSchedule::factory()->create()->id,
            'user_id' => Str::uuid(),
            'date' => $this->faker->date(),
            'slot' => $this->faker->numberBetween(1, 24),
            'reschedule_count' => 0,
        ];
    }
}
