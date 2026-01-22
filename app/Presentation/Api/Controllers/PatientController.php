<?php

namespace App\Presentation\Api\Controllers;

use App\Application\Services\PatientService;
use App\Application\DTOs\CreatePatientDTO;
use Illuminate\Http\Request;

/**
 * Patient Controller
 * Handles patient-related endpoints
 */
class PatientController extends ApiController
{
    public function __construct(private PatientService $patientService)
    {
    }

    /**
     * Create patient
     * POST /api/patients
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:patients',
                'phone_number' => 'required|string',
                'date_of_birth' => 'required|date',
                'gender' => 'required|in:male,female,other',
                'address' => 'required|string',
                'city' => 'required|string',
                'state' => 'required|string',
                'zip_code' => 'required|string',
                'center_id' => 'required|exists:medical_centers,id',
            ]);

            $dto = new CreatePatientDTO($validated);
            $patient = $this->patientService->createPatient($dto);

            return $this->created($patient, 'Patient created successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Throwable $e) {
            return $this->serverError($e->getMessage());
        }
    }

    /**
     * Get patient details
     * GET /api/patients/{id}
     */
    public function show(int $patientId)
    {
        try {
            $patient = $this->patientService->getPatient($patientId);
            $medicalHistory = $this->patientService->getMedicalHistory($patientId);
            $allergies = $this->patientService->getAllergies($patientId);

            return $this->success([
                'patient' => $patient,
                'medical_history' => $medicalHistory,
                'allergies' => $allergies,
            ], 'Patient details retrieved');

        } catch (\App\Core\Exceptions\ResourceNotFoundException $e) {
            return $this->notFound($e->getMessage());
        } catch (\Throwable $e) {
            return $this->serverError($e->getMessage());
        }
    }

    /**
     * Update patient
     * PUT /api/patients/{id}
     */
    public function update(Request $request, int $patientId)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email',
                'phone_number' => 'sometimes|string',
                'address' => 'sometimes|string',
                'city' => 'sometimes|string',
                'state' => 'sometimes|string',
                'zip_code' => 'sometimes|string',
            ]);

            $patient = $this->patientService->updatePatient($patientId, $validated);

            return $this->success($patient, 'Patient updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\App\Core\Exceptions\ResourceNotFoundException $e) {
            return $this->notFound($e->getMessage());
        } catch (\Throwable $e) {
            return $this->serverError($e->getMessage());
        }
    }
}
