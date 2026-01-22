<?php

namespace App\Domain\ValueObjects;

/**
 * Phone number value object
 */
class PhoneNumber
{
    private string $value;

    public function __construct(string $value)
    {
        $cleaned = preg_replace('/[^0-9+]/', '', $value);
        
        if (strlen($cleaned) < 10) {
            throw new \InvalidArgumentException("Invalid phone number: {$value}");
        }

        $this->value = $cleaned;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function equals(PhoneNumber $other): bool
    {
        return $this->value === $other->value;
    }
}
