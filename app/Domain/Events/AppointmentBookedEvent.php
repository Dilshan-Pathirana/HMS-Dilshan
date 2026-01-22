<?php

namespace App\Domain\Events;

/**
 * Fired when appointment is booked
 */
class AppointmentBookedEvent extends DomainEvent
{
    private array $appointmentData;

    public function __construct(string $appointmentId, array $appointmentData)
    {
        parent::__construct($appointmentId);
        $this->appointmentData = $appointmentData;
    }

    public function eventName(): string
    {
        return 'appointment.booked';
    }

    public function toPayload(): array
    {
        return $this->appointmentData;
    }
}
