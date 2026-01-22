<?php

namespace Database\Factories\EmployeeOT;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EmployeeOT>
 */
class EmployeeOTFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_id' => $this->faker->uuid(),
            'date' => $this->faker->date(),
            'hours_worked' => $this->faker->randomFloat(2, 1, 10),
            'ot_rate' => $this->faker->randomFloat(2, 10, 50),
            'total_ot_amount' => function (array $attributes) {
                return $attributes['hours_worked'] * $attributes['ot_rate'];
            },
        ];
    }
}
