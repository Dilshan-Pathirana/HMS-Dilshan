<?php

namespace Database\Factories\Pharmacy;

use App\Models\Pharmacy\Product;
use App\Models\Pharmacy\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pharmacy\ProductDiscount>
 */
class ProductDiscountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $supplier = Supplier::factory()->create();

        $product = Product::factory()->create([
            'supplier_id' => $supplier->id,
        ]);

        return [
            'product_id' => $product->id,
            'discount_type' => $this->faker->randomElement(['type1', 'type2', 'type3']),
            'discount_amount' => $this->faker->randomNumber(3),
            'discount_percentage' => $this->faker->randomNumber(1),
        ];
    }
}
