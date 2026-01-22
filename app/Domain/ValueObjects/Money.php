<?php

namespace App\Domain\ValueObjects;

/**
 * Money value object
 * Ensures consistent decimal handling for monetary values
 */
class Money
{
    private float $amount;
    private string $currency;

    public function __construct(float $amount, string $currency = 'USD')
    {
        if ($amount < 0) {
            throw new \InvalidArgumentException("Amount cannot be negative: {$amount}");
        }

        $this->amount = round($amount, 2);
        $this->currency = strtoupper($currency);
    }

    public function getAmount(): float
    {
        return $this->amount;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function add(Money $other): Money
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException("Cannot add different currencies");
        }

        return new Money($this->amount + $other->amount, $this->currency);
    }

    public function subtract(Money $other): Money
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException("Cannot subtract different currencies");
        }

        $result = $this->amount - $other->amount;
        if ($result < 0) {
            throw new \InvalidArgumentException("Subtraction would result in negative amount");
        }

        return new Money($result, $this->currency);
    }

    public function equals(Money $other): bool
    {
        return $this->amount === $other->amount && $this->currency === $other->currency;
    }

    public function __toString(): string
    {
        return number_format($this->amount, 2) . ' ' . $this->currency;
    }
}
