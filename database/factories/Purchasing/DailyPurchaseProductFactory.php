<?php

namespace Database\Factories\Purchasing;

use Illuminate\Support\Str;
use App\Models\Pharmacy\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Purchasing\DailyPurchaseProduct>
 */
class DailyPurchaseProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => $this->faker->uuid,
            'qty' => $this->faker->numberBetween(1, 100),
            'price' => $this->faker->randomFloat(2, 10, 100),
        ];
    }

    public function withPurchaseProduct(): static
    {
        $product = Product::factory()->create([
            'id' => Str::uuid(),
        ]);

        return $this->state(fn (array $attributes) => [
            'product_id' => $product->id,
        ]);
    }
}
