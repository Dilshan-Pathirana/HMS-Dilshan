<?php

namespace Database\Factories\DoctorSession;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DoctorSession\DoctorSession>
 */
class DoctorSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'branch_id' => Str::uuid(),
            'doctor_id' => Str::uuid(),
            'patient_id' => Str::uuid(),
        ];
    }
}
