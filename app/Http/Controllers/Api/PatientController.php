<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Repositories\PatientRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class PatientController extends Controller
{
    public function __construct(
        private PatientRepositoryInterface $patientRepository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;
        
        if ($request->has('search')) {
            $patients = $this->patientRepository->search(
                $request->search,
                $centerId,
                $request->per_page ?? 15
            );
        } else {
            $patients = $this->patientRepository->getActiveByCenter($centerId);
        }

        return response()->json($patients);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'nic' => 'required|string|max:20|unique:patients',
            'date_of_birth' => 'required|date',
            'gender' => 'required|in:male,female,other',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'blood_group' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'emergency_contact_name' => 'required|string|max:255',
            'emergency_contact_phone' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['center_id'] = $request->user()->center_id;
        
        // Generate unique registration number
        $latestPatient = $this->patientRepository->findAll()
            ->where('center_id', $data['center_id'])
            ->orderBy('id', 'desc')
            ->first();
        
        $nextNumber = $latestPatient ? (intval(substr($latestPatient->unique_registration_number, -6)) + 1) : 1;
        $data['unique_registration_number'] = 'P' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

        $patient = $this->patientRepository->create($data);

        return response()->json($patient, 201);
    }

    public function show(int $id): JsonResponse
    {
        $patient = $this->patientRepository->findWithMedicalHistory($id);

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        return response()->json($patient);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'string|max:100',
            'last_name' => 'string|max:100',
            'phone' => 'string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'string',
            'city' => 'string|max:100',
            'blood_group' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'emergency_contact_name' => 'string|max:255',
            'emergency_contact_phone' => 'string|max:20',
            'medical_history' => 'nullable|array',
            'allergies' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $patient = $this->patientRepository->update($id, $validator->validated());

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        return response()->json($patient);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->patientRepository->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        return response()->json(['message' => 'Patient deleted successfully']);
    }

    public function searchByRegistration(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'registration_number' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $patient = $this->patientRepository->findByRegistrationNumber(
            $request->registration_number,
            $request->user()->center_id
        );

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        return response()->json($patient);
    }
}
