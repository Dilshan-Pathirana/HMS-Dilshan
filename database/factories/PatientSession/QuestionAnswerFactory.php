<?php

namespace Database\Factories\PatientSession;

use Illuminate\Support\Str;
use App\Models\PatientSession\MainQuestions;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuestionAnswer>
 */
class QuestionAnswerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'question_id' => MainQuestions::factory(),
            'answer' => fake()->sentence(),
        ];
    }
}
