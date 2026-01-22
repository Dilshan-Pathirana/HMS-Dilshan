<?php

namespace App\Domain\Events;

/**
 * Base domain event
 * All domain events should extend this class
 */
abstract class DomainEvent
{
    private \DateTime $occurredAt;
    private string $aggregateId;

    public function __construct(string $aggregateId)
    {
        $this->aggregateId = $aggregateId;
        $this->occurredAt = new \DateTime();
    }

    public function getAggregateId(): string
    {
        return $this->aggregateId;
    }

    public function getOccurredAt(): \DateTime
    {
        return $this->occurredAt;
    }

    abstract public function eventName(): string;

    abstract public function toPayload(): array;
}
