<?php

namespace App\Application\DTOs;

/**
 * Appointment creation DTO
 */
class CreateAppointmentDTO extends BaseDTO
{
    public string $patientId;
    public string $doctorId;
    public string $centerId;
    public string $appointmentDate;
    public string $appointmentTime;
    public string $appointmentType;
    public float $bookingFee;
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
