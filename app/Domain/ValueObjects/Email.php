<?php

namespace App\Domain\ValueObjects;

/**
 * Email value object
 * Ensures email is always valid
 */
class Email
{
    public function __construct(private string $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email format: {$value}");
        }
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function equals(Email $other): bool
    {
        return strtolower($this->value) === strtolower($other->value);
    }
}
