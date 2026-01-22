<?php

namespace App\Action\PatientAppointment;

use Exception;
use App\Models\AllUsers\User;
use App\Models\AllUsers\Patient;
use App\Models\Appointment\PatientAppointment;
use Symfony\Component\HttpFoundation\Response;
use App\Action\User\Patient\CreateNewPatientUser;

trait PatientAppointmentBase
{
    public string $userId = '';

    private function generateUniqueEmail(string $firstName, string $lastName): string
    {
        $baseEmail = strtolower($firstName.'.'.$lastName.'@curehms.com');
        $counter = 1;

        while (User::where('email', $baseEmail)->exists()) {
            $baseEmail = strtolower($firstName.'.'.$lastName.$counter.'@curehms.com');
            $counter++;
        }

        return $baseEmail;
    }

    protected function normalizeValidatedData(array $validated): array
    {
        if (isset($validated['NIC'])) {
            $validated['nic'] = $validated['NIC'];
        }
        if (empty($validated['nic'])) {
            $validated['nic'] = '';
        }

        if (empty($validated['email'])) {
            $emailBase = strtolower($validated['first_name'].'.'.$validated['last_name'].'@curehms.com');
            $validated['email'] = $emailBase;

            $emailExists = User::where('email', $validated['email'])->exists();
            if ($emailExists) {
                $validated['email'] = $this->generateUniqueEmail($validated['first_name'], $validated['last_name']);
            }
        }

        if (empty($validated['address'])) {
            $validated['address'] = '';
        }

        return $validated;
    }

    protected function findOrCreatePatient(array $validated): void
    {
        $patient = Patient::where('phone', $validated['phone'])->first();

        if ($patient) {
            $this->userId = $patient->user_id;
        } else {
            $createNewPatientUser = new CreateNewPatientUser();
            $response = $createNewPatientUser($validated);

            if ($response['status'] === Response::HTTP_OK) {
                $patient = $createNewPatientUser->getNewlyCreatedPatientUsers();
                $this->userId = $patient->user_id;
            } else {
                throw new Exception('Failed to create patient user: '.($response['message'] ?? 'Unknown error'));
            }
        }

        if (empty($this->userId)) {
            throw new Exception('User ID is not set - patient creation may have failed');
        }
    }

    protected function checkForExistingAppointment(array $validated): bool
    {
        $existingAppointment = PatientAppointment::findPatientAppointment(
            $this->userId,
            $validated['date'],
            $validated['slot'],
            $validated['doctor_id'],
            $validated['schedule_id']
        );

        return $existingAppointment !== null;
    }
}
