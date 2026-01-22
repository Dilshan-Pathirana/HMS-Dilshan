<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Repositories\SessionRepositoryInterface;
use App\Domain\Repositories\AppointmentRepositoryInterface;
use App\Domain\Repositories\PrescriptionRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SessionController extends Controller
{
    public function __construct(
        private SessionRepositoryInterface $sessionRepository,
        private AppointmentRepositoryInterface $appointmentRepository,
        private PrescriptionRepositoryInterface $prescriptionRepository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $doctorId = $request->doctor_id ?? $request->user()->id;
        
        $sessions = $this->sessionRepository->getByDoctorWithPatient(
            $doctorId,
            $request->per_page ?? 15
        );

        return response()->json($sessions);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'appointment_id' => 'required|exists:appointments,id',
            'diagnosis' => 'nullable|string',
            'observations' => 'nullable|array',
            'session_notes' => 'nullable|string',
            'consultation_fee' => 'required|numeric|min:0',
            'follow_up_date' => 'nullable|date|after:today',
            'follow_up_instructions' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $appointment = $this->appointmentRepository->find($request->appointment_id);

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        // Check if session already exists
        $existingSession = $this->sessionRepository->findByAppointment($request->appointment_id);
        if ($existingSession) {
            return response()->json(['message' => 'Session already exists for this appointment'], 409);
        }

        $data = $validator->validated();
        $data['patient_id'] = $appointment->patient_id;
        $data['doctor_id'] = $appointment->doctor_id;
        $data['center_id'] = $appointment->center_id;
        $data['status'] = 'ongoing';

        $session = $this->sessionRepository->create($data);

        // Update appointment status
        $this->appointmentRepository->update($appointment->id, ['status' => 'in_session']);

        return response()->json($session, 201);
    }

    public function show(int $id): JsonResponse
    {
        $session = $this->sessionRepository->findWithDetails($id);

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        return response()->json($session);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'diagnosis' => 'nullable|string',
            'observations' => 'nullable|array',
            'session_notes' => 'nullable|string',
            'consultation_fee' => 'numeric|min:0',
            'follow_up_date' => 'nullable|date|after:today',
            'follow_up_instructions' => 'nullable|string',
            'status' => 'in:ongoing,completed,canceled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $session = $this->sessionRepository->update($id, $validator->validated());

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        // If session completed, update appointment
        if (isset($validator->validated()['status']) && $validator->validated()['status'] === 'completed') {
            $this->appointmentRepository->update($session->appointment_id, ['status' => 'completed']);
        }

        return response()->json($session);
    }

    public function addPrescription(Request $request, int $sessionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'medication_id' => 'required|exists:medications,id',
            'dosage' => 'required|string',
            'frequency' => 'required|string',
            'duration' => 'required|integer|min:1',
            'instructions' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $session = $this->sessionRepository->find($sessionId);

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $data = $validator->validated();
        $data['session_id'] = $sessionId;
        $data['patient_id'] = $session->patient_id;
        $data['doctor_id'] = $session->doctor_id;
        $data['center_id'] = $session->center_id;
        $data['is_dispensed'] = false;

        $prescription = $this->prescriptionRepository->create($data);

        return response()->json($prescription, 201);
    }

    public function ongoing(Request $request): JsonResponse
    {
        $doctorId = $request->doctor_id ?? $request->user()->id;
        $sessions = $this->sessionRepository->getOngoingByDoctor($doctorId);

        return response()->json($sessions);
    }

    public function patientHistory(int $patientId): JsonResponse
    {
        $sessions = $this->sessionRepository->getCompletedByPatient($patientId);

        return response()->json($sessions);
    }
}
