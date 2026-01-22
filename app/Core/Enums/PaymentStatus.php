<?php

namespace App\Core\Enums;

enum PaymentStatus: string
{
    case PENDING = 'pending';
    case PAID = 'paid';
    case PARTIALLY_PAID = 'partially_paid';
    case FAILED = 'failed';
    case REFUNDED = 'refunded';
    case CANCELED = 'canceled';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::PAID => 'Paid',
            self::PARTIALLY_PAID => 'Partially Paid',
            self::FAILED => 'Failed',
            self::REFUNDED => 'Refunded',
            self::CANCELED => 'Canceled',
        };
    }

    public function isCompleted(): bool
    {
        return in_array($this, [self::PAID, self::REFUNDED]);
    }
}
