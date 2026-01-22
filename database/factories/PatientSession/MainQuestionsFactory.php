<?php

namespace Database\Factories\PatientSession;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PatientSession\MainQuestions>
 */
class MainQuestionsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'question' => $this->faker->sentence,
            'description' => $this->faker->paragraph,
            'order' => $this->faker->numberBetween(1, 20),
            'status' => $this->faker->randomElement([0, 1]),
        ];
    }
}
