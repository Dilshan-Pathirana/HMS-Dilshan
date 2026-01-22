<?php

namespace Database\Factories\Pharmacy;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pharmacy\Warranty>
 */
class WarrantyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'warranty_serial' => Str::random(10),
            'warranty_duration' => $this->faker->randomElement(['3 Months', '6 Months', '1 Years']),
            'warranty_start_date' => $this->faker->date(),
            'warranty_end_date' => $this->faker->date(),
            'warranty_type' => $this->faker->randomElement(['claim', 'not-claim']),
        ];
    }
}
