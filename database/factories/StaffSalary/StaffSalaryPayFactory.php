<?php

namespace Database\Factories\StaffSalary;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StaffSalaryPay>
 */
class StaffSalaryPayFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'paid_salary_amount' => $this->faker->randomFloat(2, 2000, 10000),
            'month' => $this->faker->monthName,
        ];
    }
}
