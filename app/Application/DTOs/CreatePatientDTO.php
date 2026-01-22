<?php

namespace App\Application\DTOs;

/**
 * Patient creation DTO
 */
class CreatePatientDTO extends BaseDTO
{
    public string $firstName;
    public string $lastName;
    public string $email;
    public string $phoneNumber;
    public string $dateOfBirth;
    public string $gender;
    public string $address;
    public string $city;
    public string $state;
    public string $zipCode;
    public string $centerId;
    public ?string $emergencyContact = null;
    public ?string $medicalHistory = null;
    public ?array $allergies = null;

    public function __construct(array $data)
    {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
    }
}
