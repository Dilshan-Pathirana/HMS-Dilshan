<?php

namespace App\Domain\Events;

/**
 * Fired when prescription is created
 */
class PrescriptionCreatedEvent extends DomainEvent
{
    private array $prescriptionData;

    public function __construct(string $prescriptionId, array $prescriptionData)
    {
        parent::__construct($prescriptionId);
        $this->prescriptionData = $prescriptionData;
    }

    public function eventName(): string
    {
        return 'prescription.created';
    }

    public function toPayload(): array
    {
        return $this->prescriptionData;
    }
}
