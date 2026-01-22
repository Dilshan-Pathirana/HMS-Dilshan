<?php

namespace Database\Factories\DoctorCreatedDisease;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DoctorCreatedDisease\DoctorCreatedDisease>
 */
class DoctorCreatedDiseaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'doctor_id' => $this->faker->uuid(),
            'disease_name' => $this->faker->word(),
            'description' => $this->faker->sentence(),
            'priority' => $this->faker->numberBetween(1, 5),
        ];
    }
}
