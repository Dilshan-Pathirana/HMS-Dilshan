<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Models\Appointment\AppointmentBooking;
use App\Models\Appointment\AppointmentLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DoctorAppointmentController extends Controller
{
    /**
     * Get all appointments for a doctor
     */
    public function getAppointments(Request $request): JsonResponse
    {
        try {
            $doctorId = $request->user()->id;
            $date = $request->query('date');
            $status = $request->query('status', 'all');
            $branchId = $request->query('branch_id');

            $query = DB::table('appointment_bookings')
                ->join('patients', function ($join) {
                    $join->on('appointment_bookings.patient_id', '=', 'patients.user_id')
                         ->orOn('appointment_bookings.patient_id', '=', DB::raw('CAST(patients.id AS TEXT)'));
                })
                ->join('branches', 'appointment_bookings.branch_id', '=', 'branches.id')
                ->where('appointment_bookings.doctor_id', $doctorId)
                ->select([
                    'appointment_bookings.*',
                    'patients.first_name as patient_first_name',
                    'patients.last_name as patient_last_name',
                    'patients.phone_number as patient_phone',
                    'patients.email as patient_email',
                    'branches.center_name as branch_name',
                ])
                ->orderBy('appointment_bookings.appointment_date', 'asc')
                ->orderBy('appointment_bookings.token_number', 'asc');

            // Filter by date
            if ($date) {
                $query->whereDate('appointment_bookings.appointment_date', $date);
            }

            // Filter by status
            if ($status !== 'all') {
                $query->where('appointment_bookings.status', $status);
            }

            // Filter by branch
            if ($branchId) {
                $query->where('appointment_bookings.branch_id', $branchId);
            }

            $appointments = $query->get()->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'patient_id' => $apt->patient_id,
                    'patient_name' => trim(($apt->patient_first_name ?? '') . ' ' . ($apt->patient_last_name ?? '')),
                    'patient_phone' => $apt->patient_phone,
                    'patient_email' => $apt->patient_email,
                    'branch_id' => $apt->branch_id,
                    'branch_name' => $apt->branch_name,
                    'appointment_date' => $apt->appointment_date,
                    'appointment_time' => Carbon::parse($apt->appointment_time)->format('h:i A'),
                    'slot_number' => $apt->slot_number,
                    'token_number' => $apt->token_number,
                    'appointment_type' => $apt->appointment_type,
                    'booking_type' => $apt->booking_type,
                    'status' => $apt->status,
                    'payment_status' => $apt->payment_status,
                    'notes' => $apt->notes,
                    'checked_in_at' => $apt->checked_in_at,
                    'session_started_at' => $apt->session_started_at,
                    'completed_at' => $apt->completed_at,
                ];
            });

            // Get counts
            $today = now()->toDateString();
            $counts = [
                'today_total' => AppointmentBooking::where('doctor_id', $doctorId)
                    ->whereDate('appointment_date', $today)
                    ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                    ->count(),
                'today_confirmed' => AppointmentBooking::where('doctor_id', $doctorId)
                    ->whereDate('appointment_date', $today)
                    ->where('status', AppointmentBooking::STATUS_CONFIRMED)
                    ->count(),
                'today_completed' => AppointmentBooking::where('doctor_id', $doctorId)
                    ->whereDate('appointment_date', $today)
                    ->where('status', AppointmentBooking::STATUS_COMPLETED)
                    ->count(),
                'today_no_show' => AppointmentBooking::where('doctor_id', $doctorId)
                    ->whereDate('appointment_date', $today)
                    ->where('status', AppointmentBooking::STATUS_NO_SHOW)
                    ->count(),
            ];

            return response()->json([
                'status' => 200,
                'appointments' => $appointments,
                'counts' => $counts,
                'total' => $appointments->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Get doctor appointments error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get appointments',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get today's queue for doctor
     */
    public function getTodaysQueue(Request $request): JsonResponse
    {
        try {
            $doctorId = $request->user()->id;
            $branchId = $request->query('branch_id');
            $today = now()->toDateString();

            $query = DB::table('appointment_bookings')
                ->leftJoin('patients', function ($join) {
                    $join->on('appointment_bookings.patient_id', '=', 'patients.user_id')
                         ->orOn('appointment_bookings.patient_id', '=', DB::raw('CAST(patients.id AS TEXT)'));
                })
                ->where('appointment_bookings.doctor_id', $doctorId)
                ->whereDate('appointment_bookings.appointment_date', $today)
                ->whereIn('appointment_bookings.status', [
                    AppointmentBooking::STATUS_CONFIRMED,
                    AppointmentBooking::STATUS_CHECKED_IN,
                    AppointmentBooking::STATUS_IN_SESSION,
                ])
                ->select([
                    'appointment_bookings.*',
                    'patients.first_name as patient_first_name',
                    'patients.last_name as patient_last_name',
                    'patients.phone_number as patient_phone',
                ])
                ->orderBy('appointment_bookings.token_number', 'asc');

            if ($branchId) {
                $query->where('appointment_bookings.branch_id', $branchId);
            }

            $queue = $query->get()->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'patient_name' => trim(($apt->patient_first_name ?? '') . ' ' . ($apt->patient_last_name ?? '')),
                    'patient_phone' => $apt->patient_phone,
                    'token_number' => $apt->token_number,
                    'appointment_time' => Carbon::parse($apt->appointment_time)->format('h:i A'),
                    'status' => $apt->status,
                    'checked_in_at' => $apt->checked_in_at 
                        ? Carbon::parse($apt->checked_in_at)->format('h:i A') 
                        : null,
                    'booking_type' => $apt->booking_type,
                ];
            });

            // Get current patient in session
            $currentPatient = $queue->firstWhere('status', AppointmentBooking::STATUS_IN_SESSION);

            // Get next patient in queue
            $nextPatient = $queue->filter(function ($apt) {
                return in_array($apt['status'], [
                    AppointmentBooking::STATUS_CONFIRMED,
                    AppointmentBooking::STATUS_CHECKED_IN,
                ]);
            })->first();

            // Calculate queue statistics
            $waiting = $queue->filter(function ($apt) {
                return in_array($apt['status'], [
                    AppointmentBooking::STATUS_CONFIRMED,
                    AppointmentBooking::STATUS_CHECKED_IN,
                ]);
            })->count();

            // Get completed count for today
            $completed = DB::table('appointment_bookings')
                ->where('doctor_id', $doctorId)
                ->whereDate('appointment_date', $today)
                ->where('status', AppointmentBooking::STATUS_COMPLETED)
                ->count();

            // Get current token number
            $currentToken = $currentPatient ? ($currentPatient['token_number'] ?? 0) : 0;

            return response()->json([
                'status' => 200,
                'queue' => $queue,
                'current_patient' => $currentPatient,
                'next_patient' => $nextPatient,
                'total_in_queue' => $queue->count(),
                'summary' => [
                    'total' => $queue->count() + $completed,
                    'waiting' => $waiting,
                    'completed' => $completed,
                    'current_token' => $currentToken,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get today\'s queue error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get queue',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check in patient
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
                    'message' => 'This patient cannot be checked in',
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
                AppointmentLog::ROLE_DOCTOR,
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
     * Start session with patient
     */
    public function startSession(Request $request, string $bookingId): JsonResponse
    {
        try {
            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            if (!in_array($booking->status, [
                AppointmentBooking::STATUS_CONFIRMED,
                AppointmentBooking::STATUS_CHECKED_IN
            ])) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Cannot start session for this appointment',
                ], 400);
            }

            $user = $request->user();
            $previousStatus = $booking->status;

            $booking->update([
                'status' => AppointmentBooking::STATUS_IN_SESSION,
                'session_started_at' => now(),
            ]);

            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_SESSION_STARTED,
                $user->id,
                AppointmentLog::ROLE_DOCTOR,
                $previousStatus,
                AppointmentBooking::STATUS_IN_SESSION
            );

            return response()->json([
                'status' => 200,
                'message' => 'Session started',
            ]);
        } catch (\Exception $e) {
            Log::error('Start session error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to start session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark consultation as completed
     */
    public function completeConsultation(Request $request, string $bookingId): JsonResponse
    {
        try {
            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            if (!in_array($booking->status, [
                AppointmentBooking::STATUS_CONFIRMED,
                AppointmentBooking::STATUS_CHECKED_IN,
                AppointmentBooking::STATUS_IN_SESSION
            ])) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Cannot complete this appointment',
                ], 400);
            }

            $user = $request->user();
            $previousStatus = $booking->status;
            $notes = $request->input('notes');

            $booking->update([
                'status' => AppointmentBooking::STATUS_COMPLETED,
                'completed_at' => now(),
                'notes' => $notes ? ($booking->notes ? $booking->notes . "\n" . $notes : $notes) : $booking->notes,
            ]);

            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_COMPLETED,
                $user->id,
                AppointmentLog::ROLE_DOCTOR,
                $previousStatus,
                AppointmentBooking::STATUS_COMPLETED,
                $notes
            );

            return response()->json([
                'status' => 200,
                'message' => 'Consultation marked as completed',
            ]);
        } catch (\Exception $e) {
            Log::error('Complete consultation error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to complete consultation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark patient as no-show
     */
    public function markNoShow(Request $request, string $bookingId): JsonResponse
    {
        try {
            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            if ($booking->status !== AppointmentBooking::STATUS_CONFIRMED) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Cannot mark this appointment as no-show',
                ], 400);
            }

            $user = $request->user();
            $reason = $request->input('reason', 'Patient did not show up');

            $booking->update([
                'status' => AppointmentBooking::STATUS_NO_SHOW,
            ]);

            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_NO_SHOW,
                $user->id,
                AppointmentLog::ROLE_DOCTOR,
                AppointmentBooking::STATUS_CONFIRMED,
                AppointmentBooking::STATUS_NO_SHOW,
                $reason
            );

            return response()->json([
                'status' => 200,
                'message' => 'Patient marked as no-show',
            ]);
        } catch (\Exception $e) {
            Log::error('Mark no-show error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to mark as no-show',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get appointment statistics for doctor dashboard
     */
    public function getStatistics(Request $request): JsonResponse
    {
        try {
            $doctorId = $request->user()->id;
            $today = now()->toDateString();
            $thisWeekStart = now()->startOfWeek()->toDateString();
            $thisWeekEnd = now()->endOfWeek()->toDateString();
            $thisMonthStart = now()->startOfMonth()->toDateString();
            $thisMonthEnd = now()->endOfMonth()->toDateString();

            $stats = [
                'today' => [
                    'total' => AppointmentBooking::forDoctor($doctorId)->forDate($today)
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                        ->count(),
                    'completed' => AppointmentBooking::forDoctor($doctorId)->forDate($today)
                        ->where('status', AppointmentBooking::STATUS_COMPLETED)
                        ->count(),
                    'pending' => AppointmentBooking::forDoctor($doctorId)->forDate($today)
                        ->whereIn('status', [AppointmentBooking::STATUS_CONFIRMED, AppointmentBooking::STATUS_CHECKED_IN])
                        ->count(),
                    'no_show' => AppointmentBooking::forDoctor($doctorId)->forDate($today)
                        ->where('status', AppointmentBooking::STATUS_NO_SHOW)
                        ->count(),
                ],
                'this_week' => [
                    'total' => AppointmentBooking::forDoctor($doctorId)
                        ->whereBetween('appointment_date', [$thisWeekStart, $thisWeekEnd])
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                        ->count(),
                    'completed' => AppointmentBooking::forDoctor($doctorId)
                        ->whereBetween('appointment_date', [$thisWeekStart, $thisWeekEnd])
                        ->where('status', AppointmentBooking::STATUS_COMPLETED)
                        ->count(),
                ],
                'this_month' => [
                    'total' => AppointmentBooking::forDoctor($doctorId)
                        ->whereBetween('appointment_date', [$thisMonthStart, $thisMonthEnd])
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                        ->count(),
                    'completed' => AppointmentBooking::forDoctor($doctorId)
                        ->whereBetween('appointment_date', [$thisMonthStart, $thisMonthEnd])
                        ->where('status', AppointmentBooking::STATUS_COMPLETED)
                        ->count(),
                ],
                'upcoming' => AppointmentBooking::forDoctor($doctorId)
                    ->where('appointment_date', '>', $today)
                    ->whereIn('status', [AppointmentBooking::STATUS_CONFIRMED, AppointmentBooking::STATUS_PENDING_PAYMENT])
                    ->count(),
            ];

            return response()->json([
                'status' => 200,
                'statistics' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('Get statistics error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
