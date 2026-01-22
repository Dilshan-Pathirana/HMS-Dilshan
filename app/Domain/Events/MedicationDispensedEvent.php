<?php

namespace App\Domain\Events;

/**
 * Fired when medication is dispensed
 */
class MedicationDispensedEvent extends DomainEvent
{
    private array $dispensingData;

    public function __construct(string $dispensingId, array $dispensingData)
    {
        parent::__construct($dispensingId);
        $this->dispensingData = $dispensingData;
    }

    public function eventName(): string
    {
        return 'medication.dispensed';
    }

    public function toPayload(): array
    {
        return $this->dispensingData;
    }
}
