<?php

namespace Database\Factories\StaffSalary;

use App\Models\StaffSalary\StaffSalary;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StaffSalary\StaffSalary>
 */
class StaffSalaryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = StaffSalary::class;

    public function definition(): array
    {
        return [
            'basic_salary_amount' => $this->faker->randomFloat(2, 3000, 10000),
            'allocation_amount' => $this->faker->optional()->randomFloat(2, 500, 2000),
            'rate_for_hour' => $this->faker->optional()->randomFloat(2, 20, 50),
            'maximum_hours_can_work' => $this->faker->numberBetween(20, 60),
        ];
    }
}
