<?php

namespace Database\Factories\Shift;

use App\Models\Shift\Shift;
use Illuminate\Support\Str;
use App\Models\AllUsers\User;
use App\Models\Hospital\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ShiftManagement>
 */
class ShiftFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = Shift::class;

    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'user_id' => User::factory(),
            'branch_id' => Branch::factory(),
            'shift_type' => $this->faker->randomElement(['Day shift', 'Night shift']),
            'days_of_week' => json_encode($this->faker->randomElements(['1', '2', '3', '4', '5', '6', '7'], rand(1, 7))),
            'start_time' => $this->faker->time('H:i'),
            'end_time' => $this->faker->time('H:i'),
            'notes' => $this->faker->sentence(),
        ];
    }
}
