<?php

namespace Database\Factories\LeavesManagement;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LeavesManagement\LeavesManagement>
 */
class LeavesManagementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-1 month', '+1 month');
        $endDate = $this->faker->dateTimeBetween($startDate->format('Y-m-d'), $startDate->modify('+7 days')->format('Y-m-d'));
        $leavesDays = $endDate->diff($startDate)->days + 1;

        return [
            'leaves_start_date' => $startDate->format('Y-m-d'),
            'leaves_end_date' => $endDate->format('Y-m-d'),
            'reason' => $this->faker->optional()->sentence(),
            'status' => $this->faker->randomElement(['Pending', 'Approved', 'Rejected', 'Cancelled']),
            'assigner' => $this->faker->optional()->uuid(),
            'approval_date' => $this->faker->optional()->dateTimeBetween($endDate, '+1 month'),
            'comments' => $this->faker->optional()->text(),
            'leaves_days' => $leavesDays,
        ];
    }
}
