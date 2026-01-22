<?php

namespace Database\Factories\Purchasing;

use Illuminate\Support\Str;
use App\Models\AllUsers\User;
use App\Services\PurchasingBills\CreateInvoiceID;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Purchasing\DailyBill>
 */
class DailyBillFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory()->create();

        return [
            'id' => Str::uuid(),
            'user_id' => $user->id,
            'customer_id' => Str::uuid(),
            'customer_name' => $this->faker->name(),
            'contact_number' => $this->faker->phoneNumber(),
            'invoice_id' => CreateInvoiceID::execute(),
            'discount_amount' => $this->faker->randomFloat(2, 0, 500),
            'total_amount' => $this->faker->randomFloat(2, 1000, 5000),
            'net_total' => $this->faker->randomFloat(2, 0, 500),
            'amount_received' => $this->faker->randomFloat(2, 1000, 6000),
            'remain_amount' => $this->faker->randomFloat(2, 0, 1000),
        ];
    }
}
