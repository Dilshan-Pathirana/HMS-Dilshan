<?php

namespace App\Core\Enums;

enum SessionStatus: string
{
    case PENDING = 'pending';
    case ONGOING = 'ongoing';
    case COMPLETED = 'completed';
    case CANCELED = 'canceled';
    case ARCHIVED = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::ONGOING => 'Ongoing',
            self::COMPLETED => 'Completed',
            self::CANCELED => 'Canceled',
            self::ARCHIVED => 'Archived',
        };
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::COMPLETED, self::CANCELED, self::ARCHIVED]);
    }
}
