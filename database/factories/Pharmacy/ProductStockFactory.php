<?php

namespace Database\Factories\Pharmacy;

use Illuminate\Support\Str;
use App\Models\Pharmacy\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductStock>
 */
class ProductStockFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'unit' => $this->faker->randomElement(['g', 'kg', 'l', 'ml', 'pcs']),
            'current_stock' => $this->faker->randomFloat(2, 1, 1000),
            'min_stock' => $this->faker->randomFloat(2, 1, 100),
            'reorder_level' => $this->faker->randomFloat(2, 1, 200),
            'reorder_quantity' => $this->faker->randomFloat(2, 1, 500),
            'unit_cost' => $this->faker->randomFloat(2, 1, 500),
            'unit_selling_price' => $this->faker->randomFloat(2, 1, 1000),
            'expiry_date' => $this->faker->date('Y-m-d'),
            'entry_date' => $this->faker->date('Y-m-d'),
            'stock_status' => $this->faker->word,
            'product_store_location' => $this->faker->word,
            'stock_update_date' => $this->faker->date('Y-m-d'),
            'damaged_stock' => $this->faker->word,
            ];
    }

    public function withProduct(): static
    {
        $product = Product::factory()->create([
            'id' => Str::uuid(),
        ]);

        return $this->state(fn (array $attributes) => [
            'product_id' => $product->id,
        ]);
    }
}
