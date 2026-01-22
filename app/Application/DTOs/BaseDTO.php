<?php

namespace App\Application\DTOs;

/**
 * Base DTO (Data Transfer Object)
 * Used for transferring data between layers
 */
abstract class BaseDTO
{
    public function toArray(): array
    {
        return get_object_vars($this);
    }

    public static function fromArray(array $data): static
    {
        $dto = new static();
        
        foreach ($data as $key => $value) {
            if (property_exists($dto, $key)) {
                $dto->$key = $value;
            }
        }

        return $dto;
    }

    public function __toString(): string
    {
        return json_encode($this->toArray());
    }
}
