<?php

namespace App\Application\Services;

use App\Core\Exceptions\ResourceNotFoundException;
use App\Application\DTOs\CreatePatientDTO;
use Illuminate\Support\Facades\DB;

/**
 * Patient Service
 * Handles patient management operations
 */
class PatientService extends BaseService
{
    /**
     * Create new patient
     */
    public function createPatient(CreatePatientDTO $dto): array
    {
        try {
            $this->validateRequired([
                'first_name' => $dto->firstName,
                'last_name' => $dto->lastName,
                'email' => $dto->email,
                'phone_number' => $dto->phoneNumber,
                'center_id' => $dto->centerId,
            ], ['first_name', 'last_name', 'email', 'phone_number', 'center_id']);

            $patient = DB::table('patients')->insertGetId([
                'first_name' => $dto->firstName,
                'last_name' => $dto->lastName,
                'email' => $dto->email,
                'phone_number' => $dto->phoneNumber,
                'date_of_birth' => $dto->dateOfBirth,
                'gender' => $dto->gender,
                'address' => $dto->address,
                'city' => $dto->city,
                'state' => $dto->state,
                'zip_code' => $dto->zipCode,
                'emergency_contact' => $dto->emergencyContact,
                'center_id' => $dto->centerId,
                'unique_registration_number' => $this->generateRegistrationNumber($dto->centerId),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Log creation
            $this->log('info', 'Patient created', ['patient_id' => $patient]);

            return $this->getPatient($patient);

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get patient by ID
     */
    public function getPatient(int $patientId): array
    {
        $patient = DB::table('patients')
            ->where('id', $patientId)
            ->where('is_active', true)
            ->first();

        if (!$patient) {
            throw new ResourceNotFoundException('Patient', $patientId);
        }

        return (array) $patient;
    }

    /**
     * Update patient information
     */
    public function updatePatient(int $patientId, array $data): array
    {
        $patient = DB::table('patients')
            ->where('id', $patientId)
            ->where('is_active', true)
            ->first();

        if (!$patient) {
            throw new ResourceNotFoundException('Patient', $patientId);
        }

        DB::table('patients')
            ->where('id', $patientId)
            ->update(array_merge($data, ['updated_at' => now()]));

        $this->log('info', 'Patient updated', ['patient_id' => $patientId]);

        return $this->getPatient($patientId);
    }

    /**
     * Get patient medical history
     */
    public function getMedicalHistory(int $patientId): array
    {
        return DB::table('patient_medical_history')
            ->where('patient_id', $patientId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Get patient allergies
     */
    public function getAllergies(int $patientId): array
    {
        return DB::table('patient_allergies')
            ->where('patient_id', $patientId)
            ->get()
            ->toArray();
    }

    /**
     * Generate unique registration number
     */
    private function generateRegistrationNumber(string $centerId): string
    {
        $timestamp = now()->format('YmdHis');
        $random = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        return "REG-{$centerId}-{$timestamp}-{$random}";
    }
}
