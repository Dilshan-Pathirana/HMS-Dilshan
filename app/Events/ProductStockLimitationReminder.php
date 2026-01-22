<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class ProductStockLimitationReminder implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $productName;

    /**
     * Create a new event instance.
     */
    public function __construct(string $productName)
    {
        $this->productName = $productName;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [new Channel('vivd-firefly-891')];
    }

    public function broadcastAs(): string
    {
        return 'reminder.sent';
    }

    public function broadcastWith(): array
    {
        return ['product_name' => $this->productName];
    }
}
