<?php

namespace Database\Factories\Notification;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\NotificationManagement>
 */
class NotificationManagementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => Str::uuid(),
            'notification_type' => $this->faker->numberBetween(1, 3),
            'notification_message' => $this->faker->sentence(),
            'notification_status' => $this->faker->randomElement(['read', 'unread']),
        ];
    }
}
