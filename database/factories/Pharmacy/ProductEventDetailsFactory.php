<?php

namespace Database\Factories\Pharmacy;

use App\Models\AllUsers\User;
use App\Models\Pharmacy\Product;
use App\Models\Pharmacy\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pharmacy\ProductEventDetails>
 */
class ProductEventDetailsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory()->create([
            'role_as' => 1,
        ]);
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create([
            'supplier_id' => $supplier->id,
        ]);

        return [
            'product_id' => $product->id,
            'user_id' => $user->id,
            'previous_stock' => 100,
            'stock_related_to_event' => 10,
            'current_stock' => 90,
            'event_type' => 2,
            'event_reason' => 'product stock damaged',
        ];
    }
}
