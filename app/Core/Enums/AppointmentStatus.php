<?php

namespace App\Core\Enums;

enum AppointmentStatus: string
{
    case BOOKED = 'booked';
    case CHECKED_IN = 'checked_in';
    case IN_SESSION = 'in_session';
    case COMPLETED = 'completed';
    case CANCELED = 'canceled';
    case NO_SHOW = 'no_show';
    case RESCHEDULED = 'rescheduled';

    public function label(): string
    {
        return match ($this) {
            self::BOOKED => 'Booked',
            self::CHECKED_IN => 'Checked In',
            self::IN_SESSION => 'In Session',
            self::COMPLETED => 'Completed',
            self::CANCELED => 'Canceled',
            self::NO_SHOW => 'No Show',
            self::RESCHEDULED => 'Rescheduled',
        };
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::COMPLETED, self::CANCELED, self::NO_SHOW]);
    }
}
