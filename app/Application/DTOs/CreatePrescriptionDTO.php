<?php

namespace App\Application\DTOs;

/**
 * Prescription creation DTO
 */
class CreatePrescriptionDTO extends BaseDTO
{
    public string $sessionId;
    public string $patientId;
    public string $doctorId;
    public string $medicationId;
    public string $dosage;
    public string $frequency;
    public int $duration; // in days
    public ?string $notes = null;

    public function __construct(array $data)
    {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
    }
}
