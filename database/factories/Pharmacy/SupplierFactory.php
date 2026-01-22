<?php

namespace Database\Factories\Pharmacy;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pharmacy\Supplier>
 */
class SupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'supplier_name' => $this->faker->company,
            'contact_person' => $this->faker->name,
            'contact_number' => $this->faker->phoneNumber,
            'contact_email' => $this->faker->safeEmail,
            'supplier_address' => $this->faker->address,
            'supplier_city' => $this->faker->city,
            'supplier_country' => $this->faker->country,
            'supplier_type' => $this->faker->randomElement(['Local', 'International']),
            'products_supplied' => $this->faker->words(3, true),
            'rating' => $this->faker->name,
            'discounts_agreements' => $this->faker->sentence,
            'return_policy' => $this->faker->sentence,
            'delivery_time' => $this->faker->randomElement(['1 week', '2 weeks', '1 month']),
            'payment_terms' => $this->faker->sentence,
            'bank_details' => $this->faker->iban('US'),
            'note' => $this->faker->text(100),
        ];
    }
}
