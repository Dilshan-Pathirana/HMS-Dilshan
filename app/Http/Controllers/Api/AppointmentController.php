<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Repositories\AppointmentRepositoryInterface;
use App\Domain\Repositories\PatientRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    public function __construct(
        private AppointmentRepositoryInterface $appointmentRepository,
        private PatientRepositoryInterface $patientRepository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;
        
        if ($request->has('status')) {
            $appointments = $this->appointmentRepository->getByStatus(
                $request->status,
                $centerId,
                $request->per_page ?? 15
            );
        } elseif ($request->has('date')) {
            $appointments = $this->appointmentRepository->getByDoctorAndDate(
                $request->doctor_id ?? $request->user()->id,
                Carbon::parse($request->date)
            );
        } else {
            $appointments = $this->appointmentRepository->getPending($centerId);
        }

        return response()->json($appointments);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|date_format:H:i',
            'appointment_type' => 'required|in:consultation,follow_up,emergency',
            'booking_fee' => 'required|numeric|min:0',
            'reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['center_id'] = $request->user()->center_id;
        $data['status'] = 'booked';
        $data['payment_status'] = 'pending';
        $data['booked_by'] = $request->user()->id;

        // Check if time slot is available
        $isAvailable = $this->appointmentRepository->isTimeSlotAvailable(
            $data['doctor_id'],
            Carbon::parse($data['appointment_date']),
            $data['appointment_time']
        );

        if (!$isAvailable) {
            return response()->json([
                'message' => 'Time slot is not available'
            ], 409);
        }

        $appointment = $this->appointmentRepository->create($data);

        return response()->json($appointment, 201);
    }

    public function show(int $id): JsonResponse
    {
        $appointment = $this->appointmentRepository->findWithRelations($id);

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        return response()->json($appointment);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $appointment = $this->appointmentRepository->find($id);

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        // Check if appointment can be modified
        if ($appointment->isTerminal()) {
            return response()->json([
                'message' => 'Cannot modify completed, canceled, or no-show appointments'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'appointment_date' => 'date|after_or_equal:today',
            'appointment_time' => 'date_format:H:i',
            'status' => 'in:booked,checked_in,in_session,completed,canceled,no_show,rescheduled',
            'reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updated = $this->appointmentRepository->update($id, $validator->validated());

        return response()->json($updated);
    }

    public function cancel(int $id): JsonResponse
    {
        $appointment = $this->appointmentRepository->find($id);

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        if ($appointment->isTerminal()) {
            return response()->json([
                'message' => 'Appointment cannot be canceled'
            ], 400);
        }

        // Check 36-hour cancellation policy
        $appointmentDateTime = Carbon::parse($appointment->appointment_date . ' ' . $appointment->appointment_time);
        $hoursDifference = now()->diffInHours($appointmentDateTime, false);

        if ($hoursDifference < 36) {
            return response()->json([
                'message' => 'Appointments must be canceled at least 36 hours in advance'
            ], 400);
        }

        $this->appointmentRepository->update($id, [
            'status' => 'canceled',
            'canceled_at' => now(),
            'canceled_by' => auth()->id()
        ]);

        return response()->json(['message' => 'Appointment canceled successfully']);
    }

    public function todaySchedule(Request $request): JsonResponse
    {
        $doctorId = $request->doctor_id ?? $request->user()->id;
        $appointments = $this->appointmentRepository->getTodayByDoctor($doctorId);

        return response()->json($appointments);
    }

    public function patientAppointments(int $patientId): JsonResponse
    {
        $appointments = $this->appointmentRepository->getUpcomingByPatient($patientId);

        return response()->json($appointments);
    }
}
