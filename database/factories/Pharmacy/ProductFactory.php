<?php

namespace Database\Factories\Pharmacy;

use Illuminate\Support\Str;
use App\Models\Pharmacy\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Model>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'item_code' => $this->faker->unique()->bothify('ITEM-###'),
            'barcode' => $this->faker->unique()->bothify('BARCODE-###'),
            'item_name' => $this->faker->word,
            'generic_name' => $this->faker->word,
            'brand_name' => $this->faker->company,
            'category' => $this->faker->randomElement(['Electronics', 'Furniture', 'Appliances', 'Clothing']),
        ];
    }

    public function withSupplier(): static
    {
        $supplier = Supplier::factory()->create([
            'id' => Str::uuid(),
        ]);

        return $this->state(fn (array $attributes) => [
            'supplier_id' => $supplier->id,
        ]);
    }
}
