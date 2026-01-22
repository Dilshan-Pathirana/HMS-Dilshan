<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Models\Appointment\AppointmentBooking;
use App\Models\Appointment\AppointmentSettings;
use App\Models\Appointment\AppointmentLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReceptionistAppointmentController extends Controller
{
    /**
     * Create walk-in appointment
     */
    public function createWalkInBooking(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|string',
                'doctor_id' => 'required|string',
                'branch_id' => 'required|string',
                'schedule_id' => 'nullable|string',
                'appointment_date' => 'required|date',
                'slot_number' => 'required|integer|min:1',
                'appointment_type' => 'nullable|string|in:consultation,follow_up,emergency,routine_checkup',
                'payment_method' => 'nullable|string|in:cash,card,manual,waived',
                'amount_paid' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string|max:1000',
            ]);

            $user = $request->user();
            $patientId = $validated['patient_id'];
            $doctorId = $validated['doctor_id'];
            $branchId = $validated['branch_id'];
            $date = $validated['appointment_date'];
            $slotNumber = $validated['slot_number'];

            // Get settings
            $settings = AppointmentSettings::getForBranch($branchId);

            if (!$settings->allow_walk_in) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Walk-in appointments are not allowed at this branch',
                ], 400);
            }

            // Check for duplicate
            if (AppointmentBooking::hasDuplicate($patientId, $doctorId, $date)) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This patient already has an appointment with this doctor today',
                ], 400);
            }

            // Check slot availability
            if (!AppointmentBooking::isSlotAvailable($doctorId, $date, $slotNumber)) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This slot is no longer available',
                ], 400);
            }

            // Get schedule
            $dayOfWeek = Carbon::parse($date)->format('l');
            $schedule = DB::table('doctor_schedules')
                ->where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->where('schedule_day', $dayOfWeek)
                ->first();

            if (!$schedule) {
                return response()->json([
                    'status' => 400,
                    'message' => 'No schedule found for this doctor',
                ], 400);
            }

            // Calculate appointment time
            $startTime = Carbon::parse($schedule->start_time);
            $timePerPatient = $schedule->time_per_patient ?? 15;
            $appointmentTime = $startTime->addMinutes(($slotNumber - 1) * $timePerPatient);

            DB::beginTransaction();

            $tokenNumber = AppointmentBooking::getNextTokenNumber($doctorId, $branchId, $date);
            $paymentMethod = $validated['payment_method'] ?? 'cash';
            $amountPaid = $validated['amount_paid'] ?? 0;
            $bookingFee = $settings->walk_in_fee;

            // Determine payment status
            $paymentStatus = AppointmentBooking::PAYMENT_PENDING;
            if ($paymentMethod === 'waived') {
                $paymentStatus = AppointmentBooking::PAYMENT_WAIVED;
            } elseif ($amountPaid >= $bookingFee) {
                $paymentStatus = AppointmentBooking::PAYMENT_PAID;
            }

            $booking = AppointmentBooking::create([
                'patient_id' => $patientId,
                'doctor_id' => $doctorId,
                'branch_id' => $branchId,
                'schedule_id' => $validated['schedule_id'] ?? $schedule->id,
                'appointment_date' => $date,
                'appointment_time' => $appointmentTime->format('H:i:s'),
                'slot_number' => $slotNumber,
                'token_number' => $tokenNumber,
                'appointment_type' => $validated['appointment_type'] ?? 'consultation',
                'booking_type' => AppointmentBooking::BOOKING_WALK_IN,
                'status' => AppointmentBooking::STATUS_CONFIRMED, // Walk-ins are immediately confirmed
                'payment_status' => $paymentStatus,
                'payment_method' => $paymentMethod !== 'waived' ? $paymentMethod : null,
                'booking_fee' => $bookingFee,
                'amount_paid' => $amountPaid,
                'payment_date' => $amountPaid > 0 ? now() : null,
                'booked_by' => $user->id,
                'booked_by_role' => 'receptionist',
                'notes' => $validated['notes'] ?? null,
            ]);

            // Log the action
            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_CREATED,
                $user->id,
                AppointmentLog::ROLE_RECEPTIONIST,
                null,
                $booking->status,
                'Walk-in appointment created',
                [
                    'slot_number' => $slotNumber,
                    'token_number' => $tokenNumber,
                    'payment_method' => $paymentMethod,
                    'amount_paid' => $amountPaid,
                ]
            );

            DB::commit();

            return response()->json([
                'status' => 201,
                'message' => 'Walk-in appointment created successfully',
                'booking' => [
                    'id' => $booking->id,
                    'token_number' => $tokenNumber,
                    'appointment_date' => $date,
                    'appointment_time' => $appointmentTime->format('h:i A'),
                    'slot_number' => $slotNumber,
                    'status' => $booking->status,
                    'payment_status' => $paymentStatus,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create walk-in booking error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create walk-in appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all appointments for receptionist view
     */
    public function getAppointments(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id ?? $request->query('branch_id');
            $date = $request->query('date', now()->toDateString());
            $status = $request->query('status', 'all');

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch ID is required',
                ], 400);
            }

            $query = DB::table('appointment_bookings')
                ->join('users as doctor', 'appointment_bookings.doctor_id', '=', 'doctor.id')
                ->leftJoin('patients', function ($join) {
                    $join->on('appointment_bookings.patient_id', '=', 'patients.user_id')
                         ->orOn('appointment_bookings.patient_id', '=', DB::raw('CAST(patients.id AS TEXT)'));
                })
                ->where('appointment_bookings.branch_id', $branchId)
                ->whereDate('appointment_bookings.appointment_date', $date)
                ->select([
                    'appointment_bookings.*',
                    'doctor.first_name as doctor_first_name',
                    'doctor.last_name as doctor_last_name',
                    'patients.first_name as patient_first_name',
                    'patients.last_name as patient_last_name',
                    'patients.phone_number as patient_phone',
                ])
                ->orderBy('appointment_bookings.appointment_time', 'asc');

            if ($status !== 'all') {
                $query->where('appointment_bookings.status', $status);
            }

            $appointments = $query->get()->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'patient_id' => $apt->patient_id,
                    'patient_name' => trim(($apt->patient_first_name ?? '') . ' ' . ($apt->patient_last_name ?? '')),
                    'patient_phone' => $apt->patient_phone,
                    'doctor_id' => $apt->doctor_id,
                    'doctor_name' => trim(($apt->doctor_first_name ?? '') . ' ' . ($apt->doctor_last_name ?? '')),
                    'appointment_date' => $apt->appointment_date,
                    'appointment_time' => Carbon::parse($apt->appointment_time)->format('h:i A'),
                    'token_number' => $apt->token_number,
                    'slot_number' => $apt->slot_number,
                    'appointment_type' => $apt->appointment_type,
                    'booking_type' => $apt->booking_type,
                    'status' => $apt->status,
                    'payment_status' => $apt->payment_status,
                    'booking_fee' => $apt->booking_fee,
                    'amount_paid' => $apt->amount_paid,
                    'checked_in_at' => $apt->checked_in_at,
                ];
            });

            // Get counts
            $counts = [
                'total' => $appointments->count(),
                'confirmed' => $appointments->where('status', AppointmentBooking::STATUS_CONFIRMED)->count(),
                'checked_in' => $appointments->where('status', AppointmentBooking::STATUS_CHECKED_IN)->count(),
                'completed' => $appointments->where('status', AppointmentBooking::STATUS_COMPLETED)->count(),
                'cancelled' => $appointments->where('status', AppointmentBooking::STATUS_CANCELLED)->count(),
                'walk_in' => $appointments->where('booking_type', AppointmentBooking::BOOKING_WALK_IN)->count(),
                'online' => $appointments->where('booking_type', AppointmentBooking::BOOKING_ONLINE)->count(),
            ];

            return response()->json([
                'status' => 200,
                'appointments' => $appointments,
                'counts' => $counts,
            ]);
        } catch (\Exception $e) {
            Log::error('Get receptionist appointments error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get appointments',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check in patient at reception
     */
    public function checkInPatient(Request $request, string $bookingId): JsonResponse
    {
        try {
            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            if (!$booking->canBeCheckedIn()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This appointment cannot be checked in',
                ], 400);
            }

            $user = $request->user();
            $previousStatus = $booking->status;

            $booking->update([
                'status' => AppointmentBooking::STATUS_CHECKED_IN,
                'checked_in_at' => now(),
            ]);

            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_CHECKED_IN,
                $user->id,
                AppointmentLog::ROLE_RECEPTIONIST,
                $previousStatus,
                AppointmentBooking::STATUS_CHECKED_IN
            );

            return response()->json([
                'status' => 200,
                'message' => 'Patient checked in successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Check in patient error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to check in patient',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel appointment
     */
    public function cancelAppointment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            if (!$booking->canBeCancelled()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This appointment cannot be cancelled',
                ], 400);
            }

            $user = $request->user();
            $previousStatus = $booking->status;

            $booking->update([
                'status' => AppointmentBooking::STATUS_CANCELLED,
                'cancellation_reason' => $validated['reason'],
                'cancelled_by' => $user->id,
                'cancelled_at' => now(),
            ]);

            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_CANCELLED,
                $user->id,
                AppointmentLog::ROLE_RECEPTIONIST,
                $previousStatus,
                AppointmentBooking::STATUS_CANCELLED,
                $validated['reason']
            );

            return response()->json([
                'status' => 200,
                'message' => 'Appointment cancelled successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Cancel appointment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to cancel appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search patients for booking
     */
    public function searchPatients(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search');

            if (!$search || strlen($search) < 2) {
                return response()->json([
                    'status' => 200,
                    'patients' => [],
                ]);
            }

            $patients = DB::table('patients')
                ->where(function ($query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('phone_number', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('unique_registration_number', 'like', "%{$search}%");
                })
                ->where('is_active', true)
                ->select([
                    'id',
                    'user_id',
                    'first_name',
                    'last_name',
                    'phone_number',
                    'email',
                    'unique_registration_number',
                ])
                ->limit(20)
                ->get()
                ->map(function ($patient) {
                    return [
                        'id' => $patient->user_id ?? $patient->id,
                        'patient_id' => $patient->id,
                        'name' => trim($patient->first_name . ' ' . $patient->last_name),
                        'phone' => $patient->phone_number,
                        'email' => $patient->email,
                        'registration_number' => $patient->unique_registration_number,
                    ];
                });

            return response()->json([
                'status' => 200,
                'patients' => $patients,
            ]);
        } catch (\Exception $e) {
            Log::error('Search patients error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to search patients',
            ], 500);
        }
    }

    /**
     * Get doctors available today
     */
    public function getAvailableDoctors(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id ?? $request->query('branch_id');
            $date = $request->query('date', now()->toDateString());

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch ID is required',
                ], 400);
            }

            $dayOfWeek = Carbon::parse($date)->format('l');

            $doctors = DB::table('doctor_schedules')
                ->join('users', 'doctor_schedules.doctor_id', '=', 'users.id')
                ->leftJoin('doctors', 'users.id', '=', 'doctors.user_id')
                ->where('doctor_schedules.branch_id', $branchId)
                ->where('doctor_schedules.schedule_day', $dayOfWeek)
                ->where('doctor_schedules.status', 'active')
                ->where('doctor_schedules.is_available', true)
                ->select([
                    'users.id as doctor_id',
                    'users.first_name',
                    'users.last_name',
                    'users.profile_picture',
                    'doctors.areas_of_specialization as specialization',
                    'doctor_schedules.id as schedule_id',
                    'doctor_schedules.start_time',
                    'doctor_schedules.end_time',
                    'doctor_schedules.max_patients',
                ])
                ->get()
                ->map(function ($doctor) use ($date) {
                    // Get booked count
                    $bookedCount = AppointmentBooking::where('doctor_id', $doctor->doctor_id)
                        ->whereDate('appointment_date', $date)
                        ->whereNotIn('status', [
                            AppointmentBooking::STATUS_CANCELLED,
                            AppointmentBooking::STATUS_RESCHEDULED
                        ])
                        ->count();

                    return [
                        'doctor_id' => $doctor->doctor_id,
                        'name' => trim($doctor->first_name . ' ' . $doctor->last_name),
                        'profile_picture' => $doctor->profile_picture,
                        'specialization' => $doctor->specialization,
                        'schedule_id' => $doctor->schedule_id,
                        'start_time' => Carbon::parse($doctor->start_time)->format('h:i A'),
                        'end_time' => $doctor->end_time ? Carbon::parse($doctor->end_time)->format('h:i A') : null,
                        'max_patients' => $doctor->max_patients,
                        'booked_count' => $bookedCount,
                        'available_slots' => $doctor->max_patients - $bookedCount,
                    ];
                });

            return response()->json([
                'status' => 200,
                'doctors' => $doctors,
            ]);
        } catch (\Exception $e) {
            Log::error('Get available doctors error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get available doctors',
            ], 500);
        }
    }

    /**
     * Record payment for walk-in
     */
    public function recordPayment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_method' => 'required|string|in:cash,card,manual',
                'amount_paid' => 'required|numeric|min:0',
            ]);

            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            $user = $request->user();

            $booking->update([
                'payment_status' => AppointmentBooking::PAYMENT_PAID,
                'payment_method' => $validated['payment_method'],
                'amount_paid' => $validated['amount_paid'],
                'payment_date' => now(),
            ]);

            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_PAYMENT_RECEIVED,
                $user->id,
                AppointmentLog::ROLE_RECEPTIONIST,
                null,
                null,
                null,
                [
                    'payment_method' => $validated['payment_method'],
                    'amount_paid' => $validated['amount_paid'],
                ]
            );

            return response()->json([
                'status' => 200,
                'message' => 'Payment recorded successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Record payment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to record payment',
            ], 500);
        }
    }
}
