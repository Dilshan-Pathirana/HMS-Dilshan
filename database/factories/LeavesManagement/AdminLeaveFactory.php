<?php

namespace Database\Factories\LeavesManagement;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LeavesManagement\AdminLeave>
 */
class AdminLeaveFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'leave_id' => $this->faker->uuid(),
            'status' => $this->faker->randomElement(['Approved', 'Rejected', 'Pending']),
            'comments' => $this->faker->sentence(),
        ];
    }
}
