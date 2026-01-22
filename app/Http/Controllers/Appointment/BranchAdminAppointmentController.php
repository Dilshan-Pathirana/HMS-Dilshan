<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Models\Appointment\AppointmentBooking;
use App\Models\Appointment\AppointmentSettings;
use App\Models\Appointment\AppointmentLog;
use App\Application\Services\AppointmentNotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BranchAdminAppointmentController extends Controller
{
    /**
     * Get all appointments in branch with enhanced filtering
     * 
     * Filters:
     * - view: 'today' | 'upcoming' | 'past' | 'cancelled' | 'all'
     * - date: specific date (YYYY-MM-DD)
     * - start_date, end_date: date range
     * - doctor_id: specific doctor
     * - specialization: doctor specialization
     * - status: appointment status
     * - search: patient name, phone, or appointment ID
     */
    public function getAppointments(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch not assigned',
                ], 400);
            }

            $view = $request->query('view', 'all'); // today, upcoming, past, cancelled, all
            $date = $request->query('date');
            $doctorId = $request->query('doctor_id');
            $specialization = $request->query('specialization');
            $status = $request->query('status', 'all');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $search = $request->query('search'); // Patient name, phone, or appointment ID

            $today = now()->toDateString();

            $query = DB::table('appointment_bookings')
                ->join('users as doctor', 'appointment_bookings.doctor_id', '=', 'doctor.id')
                ->leftJoin('doctors', 'doctor.id', '=', 'doctors.user_id')
                ->leftJoin('patients', function ($join) {
                    $join->on('appointment_bookings.patient_id', '=', 'patients.user_id')
                         ->orOn('appointment_bookings.patient_id', '=', DB::raw('CAST(patients.id AS TEXT)'));
                })
                ->where('appointment_bookings.branch_id', $branchId)
                ->select([
                    'appointment_bookings.*',
                    'doctor.first_name as doctor_first_name',
                    'doctor.last_name as doctor_last_name',
                    'doctors.areas_of_specialization as doctor_specialization',
                    'patients.first_name as patient_first_name',
                    'patients.last_name as patient_last_name',
                    'patients.phone_number as patient_phone',
                    'patients.email as patient_email',
                ]);

            // View-based filtering
            switch ($view) {
                case 'today':
                    $query->whereDate('appointment_bookings.appointment_date', $today)
                          ->whereNotIn('appointment_bookings.status', [
                              AppointmentBooking::STATUS_CANCELLED, 
                              AppointmentBooking::STATUS_RESCHEDULED
                          ]);
                    break;
                case 'upcoming':
                    $query->where('appointment_bookings.appointment_date', '>', $today)
                          ->whereNotIn('appointment_bookings.status', [
                              AppointmentBooking::STATUS_CANCELLED, 
                              AppointmentBooking::STATUS_RESCHEDULED
                          ]);
                    break;
                case 'past':
                    $query->where(function($q) use ($today) {
                        $q->where('appointment_bookings.appointment_date', '<', $today)
                          ->orWhere('appointment_bookings.status', AppointmentBooking::STATUS_COMPLETED)
                          ->orWhere('appointment_bookings.status', AppointmentBooking::STATUS_NO_SHOW);
                    });
                    break;
                case 'cancelled':
                    $query->whereIn('appointment_bookings.status', [
                        AppointmentBooking::STATUS_CANCELLED, 
                        AppointmentBooking::STATUS_RESCHEDULED
                    ]);
                    break;
                // 'all' - no filter
            }

            // Additional date filters
            if ($date) {
                $query->whereDate('appointment_bookings.appointment_date', $date);
            }

            if ($startDate && $endDate) {
                $query->whereBetween('appointment_bookings.appointment_date', [$startDate, $endDate]);
            }

            // Doctor filter
            if ($doctorId) {
                $query->where('appointment_bookings.doctor_id', $doctorId);
            }

            // Specialization filter
            if ($specialization) {
                $query->where('doctors.areas_of_specialization', 'like', "%{$specialization}%");
            }

            // Status filter (can be applied in any view to further narrow down results)
            if ($status !== 'all' && $status) {
                $query->where('appointment_bookings.status', $status);
            }

            // Search filter (patient name, phone, or appointment ID)
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('patients.first_name', 'like', "%{$search}%")
                      ->orWhere('patients.last_name', 'like', "%{$search}%")
                      ->orWhere('patients.phone_number', 'like', "%{$search}%")
                      ->orWhere('appointment_bookings.id', 'like', "%{$search}%")
                      ->orWhere('appointment_bookings.token_number', 'like', "%{$search}%");
                });
            }

            // Sorting
            if ($view === 'upcoming') {
                $query->orderBy('appointment_bookings.appointment_date', 'asc')
                      ->orderBy('appointment_bookings.appointment_time', 'asc');
            } else {
                $query->orderBy('appointment_bookings.appointment_date', 'desc')
                      ->orderBy('appointment_bookings.appointment_time', 'asc');
            }

            $appointments = $query->limit(500)->get()->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'patient_id' => $apt->patient_id,
                    'patient_name' => trim(($apt->patient_first_name ?? '') . ' ' . ($apt->patient_last_name ?? '')),
                    'patient_phone' => $apt->patient_phone,
                    'patient_email' => $apt->patient_email,
                    'doctor_id' => $apt->doctor_id,
                    'doctor_name' => trim(($apt->doctor_first_name ?? '') . ' ' . ($apt->doctor_last_name ?? '')),
                    'doctor_specialization' => $apt->doctor_specialization,
                    'appointment_date' => $apt->appointment_date,
                    'appointment_time' => Carbon::parse($apt->appointment_time)->format('h:i A'),
                    'token_number' => $apt->token_number,
                    'slot_number' => $apt->slot_number,
                    'appointment_type' => $apt->appointment_type,
                    'booking_type' => $apt->booking_type,
                    'status' => $apt->status,
                    'payment_status' => $apt->payment_status,
                    'payment_method' => $apt->payment_method,
                    'booking_fee' => $apt->booking_fee,
                    'amount_paid' => $apt->amount_paid,
                    'cancellation_reason' => $apt->cancellation_reason,
                    'cancelled_by_admin_for_doctor' => $apt->cancelled_by_admin_for_doctor ?? false,
                    'notes' => $apt->notes,
                    'created_at' => $apt->created_at,
                ];
            });

            return response()->json([
                'status' => 200,
                'appointments' => $appointments,
                'total' => $appointments->count(),
                'view' => $view,
            ]);
        } catch (\Exception $e) {
            Log::error('Get branch appointments error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get appointments',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get doctor specializations available in branch
     */
    public function getSpecializations(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch not assigned',
                ], 400);
            }

            $specializations = DB::table('doctor_schedules')
                ->join('doctors', function ($join) {
                    $join->on('doctor_schedules.doctor_id', '=', 'doctors.user_id');
                })
                ->where('doctor_schedules.branch_id', $branchId)
                ->where('doctor_schedules.status', 'active')
                ->whereNotNull('doctors.areas_of_specialization')
                ->distinct()
                ->pluck('doctors.areas_of_specialization')
                ->filter()
                ->values();

            return response()->json([
                'status' => 200,
                'specializations' => $specializations,
            ]);
        } catch (\Exception $e) {
            Log::error('Get specializations error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get specializations',
            ], 500);
        }
    }

    /**
     * Get appointment statistics for dashboard
     */
    public function getStatistics(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch not assigned',
                ], 400);
            }

            $today = now()->toDateString();
            $thisWeekStart = now()->startOfWeek()->toDateString();
            $thisWeekEnd = now()->endOfWeek()->toDateString();
            $thisMonthStart = now()->startOfMonth()->toDateString();
            $thisMonthEnd = now()->endOfMonth()->toDateString();

            $stats = [
                'today' => [
                    'total' => AppointmentBooking::forBranch($branchId)->forDate($today)
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                        ->count(),
                    'confirmed' => AppointmentBooking::forBranch($branchId)->forDate($today)
                        ->where('status', AppointmentBooking::STATUS_CONFIRMED)
                        ->count(),
                    'completed' => AppointmentBooking::forBranch($branchId)->forDate($today)
                        ->where('status', AppointmentBooking::STATUS_COMPLETED)
                        ->count(),
                    'cancelled' => AppointmentBooking::forBranch($branchId)->forDate($today)
                        ->where('status', AppointmentBooking::STATUS_CANCELLED)
                        ->count(),
                    'no_show' => AppointmentBooking::forBranch($branchId)->forDate($today)
                        ->where('status', AppointmentBooking::STATUS_NO_SHOW)
                        ->count(),
                    'walk_in' => AppointmentBooking::forBranch($branchId)->forDate($today)
                        ->where('booking_type', AppointmentBooking::BOOKING_WALK_IN)
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED])
                        ->count(),
                    'online' => AppointmentBooking::forBranch($branchId)->forDate($today)
                        ->where('booking_type', AppointmentBooking::BOOKING_ONLINE)
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED])
                        ->count(),
                ],
                'this_week' => [
                    'total' => AppointmentBooking::forBranch($branchId)
                        ->whereBetween('appointment_date', [$thisWeekStart, $thisWeekEnd])
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                        ->count(),
                    'revenue' => AppointmentBooking::forBranch($branchId)
                        ->whereBetween('appointment_date', [$thisWeekStart, $thisWeekEnd])
                        ->where('payment_status', AppointmentBooking::PAYMENT_PAID)
                        ->sum('amount_paid'),
                ],
                'this_month' => [
                    'total' => AppointmentBooking::forBranch($branchId)
                        ->whereBetween('appointment_date', [$thisMonthStart, $thisMonthEnd])
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                        ->count(),
                    'completed' => AppointmentBooking::forBranch($branchId)
                        ->whereBetween('appointment_date', [$thisMonthStart, $thisMonthEnd])
                        ->where('status', AppointmentBooking::STATUS_COMPLETED)
                        ->count(),
                    'cancelled' => AppointmentBooking::forBranch($branchId)
                        ->whereBetween('appointment_date', [$thisMonthStart, $thisMonthEnd])
                        ->where('status', AppointmentBooking::STATUS_CANCELLED)
                        ->count(),
                    'revenue' => AppointmentBooking::forBranch($branchId)
                        ->whereBetween('appointment_date', [$thisMonthStart, $thisMonthEnd])
                        ->where('payment_status', AppointmentBooking::PAYMENT_PAID)
                        ->sum('amount_paid'),
                ],
            ];

            // Top doctors this month
            $topDoctors = DB::table('appointment_bookings')
                ->join('users', 'appointment_bookings.doctor_id', '=', 'users.id')
                ->where('appointment_bookings.branch_id', $branchId)
                ->whereBetween('appointment_bookings.appointment_date', [$thisMonthStart, $thisMonthEnd])
                ->where('appointment_bookings.status', AppointmentBooking::STATUS_COMPLETED)
                ->select([
                    'users.id',
                    'users.first_name',
                    'users.last_name',
                    DB::raw('COUNT(*) as appointment_count'),
                ])
                ->groupBy('users.id', 'users.first_name', 'users.last_name')
                ->orderByDesc('appointment_count')
                ->limit(5)
                ->get()
                ->map(function ($doc) {
                    return [
                        'doctor_id' => $doc->id,
                        'name' => trim($doc->first_name . ' ' . $doc->last_name),
                        'appointment_count' => $doc->appointment_count,
                    ];
                });

            $stats['top_doctors'] = $topDoctors;

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

    /**
     * Modify appointment (change doctor, time, status)
     */
    public function modifyAppointment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'doctor_id' => 'nullable|string',
                'appointment_date' => 'nullable|date',
                'slot_number' => 'nullable|integer|min:1',
                'status' => 'nullable|string|in:confirmed,cancelled,no_show',
                'notes' => 'nullable|string|max:1000',
                'reason' => 'required|string|max:500',
            ]);

            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            $user = $request->user();
            $previousStatus = $booking->status;
            $changes = [];

            DB::beginTransaction();

            // Change doctor
            if (!empty($validated['doctor_id']) && $validated['doctor_id'] !== $booking->doctor_id) {
                $changes['doctor_id'] = [
                    'from' => $booking->doctor_id,
                    'to' => $validated['doctor_id'],
                ];
                $booking->doctor_id = $validated['doctor_id'];
            }

            // Change date/slot
            if (!empty($validated['appointment_date']) || !empty($validated['slot_number'])) {
                $newDate = $validated['appointment_date'] ?? $booking->appointment_date->format('Y-m-d');
                $newSlot = $validated['slot_number'] ?? $booking->slot_number;

                // Check availability
                if (!AppointmentBooking::isSlotAvailable($booking->doctor_id, $newDate, $newSlot, $booking->id)) {
                    return response()->json([
                        'status' => 400,
                        'message' => 'The selected slot is not available',
                    ], 400);
                }

                if (!empty($validated['appointment_date'])) {
                    $changes['appointment_date'] = [
                        'from' => $booking->appointment_date->format('Y-m-d'),
                        'to' => $newDate,
                    ];
                    $booking->appointment_date = $newDate;
                }

                if (!empty($validated['slot_number'])) {
                    $changes['slot_number'] = [
                        'from' => $booking->slot_number,
                        'to' => $newSlot,
                    ];
                    $booking->slot_number = $newSlot;

                    // Recalculate appointment time
                    $dayOfWeek = Carbon::parse($booking->appointment_date)->format('l');
                    $schedule = DB::table('doctor_schedules')
                        ->where('doctor_id', $booking->doctor_id)
                        ->where('branch_id', $booking->branch_id)
                        ->where('schedule_day', $dayOfWeek)
                        ->first();

                    if ($schedule) {
                        $startTime = Carbon::parse($schedule->start_time);
                        $timePerPatient = $schedule->time_per_patient ?? 15;
                        $booking->appointment_time = $startTime->addMinutes(($newSlot - 1) * $timePerPatient)->format('H:i:s');
                    }
                }
            }

            // Change status
            if (!empty($validated['status']) && $validated['status'] !== $booking->status) {
                $changes['status'] = [
                    'from' => $booking->status,
                    'to' => $validated['status'],
                ];
                $booking->status = $validated['status'];

                if ($validated['status'] === AppointmentBooking::STATUS_CANCELLED) {
                    $booking->cancellation_reason = $validated['reason'];
                    $booking->cancelled_by = $user->id;
                    $booking->cancelled_at = now();
                }
            }

            // Update notes
            if (!empty($validated['notes'])) {
                $booking->notes = $validated['notes'];
            }

            $booking->save();

            // Log the modification
            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_MODIFIED,
                $user->id,
                AppointmentLog::ROLE_BRANCH_ADMIN,
                $previousStatus,
                $booking->status,
                $validated['reason'],
                $changes
            );

            DB::commit();

            return response()->json([
                'status' => 200,
                'message' => 'Appointment modified successfully',
                'changes' => $changes,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Modify appointment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to modify appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel appointment with reason
     * 
     * If cancelled on doctor's request, sets the cancelled_by_admin_for_doctor flag
     * which allows the patient 2 reschedule attempts instead of 1.
     */
    public function cancelAppointment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
                'for_doctor_request' => 'sometimes|boolean', // Flag: Is this cancellation on doctor's request?
            ]);

            $user = $request->user();
            $branchId = $user->branch_id;

            // Security: Verify branch ownership
            if (!$branchId) {
                return response()->json([
                    'status' => 403,
                    'message' => 'Branch not assigned',
                ], 403);
            }

            $booking = AppointmentBooking::where('id', $bookingId)
                ->where('branch_id', $branchId)
                ->first();

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found or access denied',
                ], 404);
            }

            if (!$booking->canBeCancelled()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This appointment cannot be cancelled',
                ], 400);
            }

            $previousStatus = $booking->status;
            $forDoctorRequest = $validated['for_doctor_request'] ?? false;

            DB::beginTransaction();

            $booking->update([
                'status' => AppointmentBooking::STATUS_CANCELLED,
                'cancellation_reason' => $validated['reason'],
                'cancelled_by' => $user->id,
                'cancelled_by_role' => AppointmentLog::ROLE_BRANCH_ADMIN,
                'cancelled_by_admin_for_doctor' => $forDoctorRequest,
                'cancelled_at' => now(),
            ]);

            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_CANCELLED,
                $user->id,
                AppointmentLog::ROLE_BRANCH_ADMIN,
                $previousStatus,
                AppointmentBooking::STATUS_CANCELLED,
                $validated['reason'],
                [
                    'for_doctor_request' => $forDoctorRequest,
                    'allows_2_reschedules' => $forDoctorRequest,
                ]
            );

            // Handle refund if applicable
            $settings = AppointmentSettings::getForBranch($booking->branch_id);
            if ($booking->payment_status === AppointmentBooking::PAYMENT_PAID && $settings->refund_on_cancellation) {
                $booking->update(['payment_status' => AppointmentBooking::PAYMENT_REFUNDED]);
                
                AppointmentLog::log(
                    $booking->id,
                    AppointmentLog::ACTION_REFUNDED,
                    $user->id,
                    AppointmentLog::ROLE_BRANCH_ADMIN,
                    null,
                    null,
                    'Admin cancelled - automatic refund',
                    ['refund_amount' => $booking->amount_paid]
                );
            }

            DB::commit();

            // Send notifications to Patient, Doctor, and Receptionists
            $cancellerName = "{$user->first_name} {$user->last_name}";
            AppointmentNotificationService::notifyAppointmentCancelled(
                $booking->id,
                $cancellerName,
                'Branch Admin',
                $validated['reason'],
                $forDoctorRequest
            );

            // Send SMS notification to patient about the cancellation
            try {
                $smsService = new \App\Services\AppointmentSmsService();
                $patientPhone = \App\Services\AppointmentSmsService::getPatientPhoneFromBooking($booking);
                
                if ($patientPhone) {
                    $smsDetails = \App\Services\AppointmentSmsService::getAppointmentDetailsForSms($booking);
                    $smsSent = $smsService->sendCancellationSms($booking, $patientPhone, $smsDetails);
                    Log::info('Cancellation SMS attempt', [
                        'booking_id' => $booking->id,
                        'patient_id' => $booking->patient_id,
                        'phone' => substr($patientPhone, 0, 3) . '****' . substr($patientPhone, -4),
                        'sms_sent' => $smsSent,
                    ]);
                } else {
                    Log::warning('Cancellation SMS skipped: No phone number found for patient', [
                        'booking_id' => $booking->id,
                        'patient_id' => $booking->patient_id,
                    ]);
                }
            } catch (\Exception $smsEx) {
                Log::warning('Cancellation SMS notification failed: ' . $smsEx->getMessage());
                // SMS failure should not affect the cancellation operation
            }

            $message = 'Appointment cancelled successfully';
            if ($forDoctorRequest) {
                $message .= '. Patient has been granted 2 reschedule attempts.';
            }

            return response()->json([
                'status' => 200,
                'message' => $message,
                'allows_patient_reschedule' => $forDoctorRequest,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Cancel appointment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to cancel appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get appointment settings for branch
     */
    public function getSettings(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch not assigned',
                ], 400);
            }

            $settings = AppointmentSettings::getForBranch($branchId);

            return response()->json([
                'status' => 200,
                'settings' => $settings,
            ]);
        } catch (\Exception $e) {
            Log::error('Get settings error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update appointment settings for branch
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch not assigned',
                ], 400);
            }

            $validated = $request->validate([
                'max_advance_booking_days' => 'nullable|integer|min:1|max:365',
                'min_advance_booking_hours' => 'nullable|integer|min:0|max:72',
                'default_max_patients_per_session' => 'nullable|integer|min:1|max:100',
                'default_time_per_patient' => 'nullable|integer|min:5|max:120',
                'allow_walk_in' => 'nullable|boolean',
                'require_payment_for_online' => 'nullable|boolean',
                'allow_cash_payment' => 'nullable|boolean',
                'allow_reschedule' => 'nullable|boolean',
                'max_reschedule_count' => 'nullable|integer|min:0|max:5',
                'reschedule_advance_hours' => 'nullable|integer|min:0|max:168',
                'allow_patient_cancellation' => 'nullable|boolean',
                'cancellation_advance_hours' => 'nullable|integer|min:0|max:168',
                'refund_on_cancellation' => 'nullable|boolean',
                'cancellation_fee_percentage' => 'nullable|numeric|min:0|max:100',
                'default_booking_fee' => 'nullable|numeric|min:0',
                'walk_in_fee' => 'nullable|numeric|min:0',
                'send_sms_confirmation' => 'nullable|boolean',
                'send_sms_reminder' => 'nullable|boolean',
                'reminder_hours_before' => 'nullable|integer|min:1|max:168',
                'send_email_confirmation' => 'nullable|boolean',
            ]);

            $settings = AppointmentSettings::getForBranch($branchId);
            $settings->update(array_filter($validated, fn($value) => $value !== null));

            return response()->json([
                'status' => 200,
                'message' => 'Settings updated successfully',
                'settings' => $settings->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Update settings error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get branch-wide audit logs with filtering
     * 
     * Filters:
     * - start_date, end_date: Date range
     * - action: Filter by action type
     * - admin_id: Filter by performing admin
     * - appointment_id: Filter by specific appointment
     * - per_page: Results per page (default 50)
     */
    public function getBranchAuditLogs(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch not assigned',
                ], 400);
            }

            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $action = $request->query('action');
            $adminId = $request->query('admin_id');
            $appointmentId = $request->query('appointment_id');
            $perPage = $request->query('per_page', 50);

            // Get all appointments in this branch
            $branchAppointmentIds = DB::table('appointment_bookings')
                ->where('branch_id', $branchId)
                ->pluck('id');

            $query = AppointmentLog::with(['performer', 'appointment'])
                ->whereIn('appointment_id', $branchAppointmentIds)
                ->orderByDesc('created_at');

            // Apply filters
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }
            if ($action && $action !== 'all') {
                $query->where('action', $action);
            }
            if ($adminId) {
                $query->where('performed_by', $adminId);
            }
            if ($appointmentId) {
                $query->where('appointment_id', $appointmentId);
            }

            $logs = $query->paginate($perPage);

            $formattedLogs = $logs->getCollection()->map(function ($log) {
                return [
                    'id' => $log->id,
                    'appointment_id' => $log->appointment_id,
                    'patient_name' => $log->appointment ? 
                        DB::table('patients')
                            ->where('user_id', $log->appointment->patient_id)
                            ->orWhere('id', $log->appointment->patient_id)
                            ->value(DB::raw("CONCAT(first_name, ' ', last_name)")) : null,
                    'token_number' => $log->appointment?->token_number,
                    'action' => $log->action,
                    'action_label' => $log->getActionLabel(),
                    'previous_status' => $log->previous_status,
                    'new_status' => $log->new_status,
                    'performed_by_id' => $log->performed_by,
                    'performed_by' => $log->performer 
                        ? trim($log->performer->first_name . ' ' . $log->performer->last_name)
                        : 'System',
                    'performed_by_role' => $log->performed_by_role,
                    'reason' => $log->reason,
                    'metadata' => $log->metadata,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                    'created_at_human' => $log->created_at->diffForHumans(),
                ];
            });

            // Get available actions for filter dropdown
            $availableActions = [
                AppointmentLog::ACTION_CREATED => 'Created',
                AppointmentLog::ACTION_CONFIRMED => 'Confirmed',
                AppointmentLog::ACTION_PAYMENT_RECEIVED => 'Payment Received',
                AppointmentLog::ACTION_CHECKED_IN => 'Checked In',
                AppointmentLog::ACTION_SESSION_STARTED => 'Session Started',
                AppointmentLog::ACTION_COMPLETED => 'Completed',
                AppointmentLog::ACTION_CANCELLED => 'Cancelled',
                AppointmentLog::ACTION_RESCHEDULED => 'Rescheduled',
                AppointmentLog::ACTION_NO_SHOW => 'No Show',
                AppointmentLog::ACTION_MODIFIED => 'Modified',
                AppointmentLog::ACTION_REFUNDED => 'Refunded',
                AppointmentLog::ACTION_STATUS_CHANGED => 'Status Changed',
            ];

            // Get admins who have performed actions for filter dropdown
            $admins = DB::table('appointment_logs')
                ->join('users', 'appointment_logs.performed_by', '=', 'users.id')
                ->whereIn('appointment_logs.appointment_id', $branchAppointmentIds)
                ->select([
                    'users.id',
                    DB::raw("CONCAT(users.first_name, ' ', users.last_name) as name"),
                ])
                ->distinct()
                ->get();

            return response()->json([
                'status' => 200,
                'logs' => $formattedLogs,
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
                'filters' => [
                    'actions' => $availableActions,
                    'admins' => $admins,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get branch audit logs error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get audit logs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get appointment logs
     */
    public function getAppointmentLogs(string $bookingId): JsonResponse
    {
        try {
            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            $logs = AppointmentLog::with('performer')
                ->where('appointment_id', $bookingId)
                ->orderByDesc('created_at')
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'action' => $log->action,
                        'action_label' => $log->getActionLabel(),
                        'previous_status' => $log->previous_status,
                        'new_status' => $log->new_status,
                        'performed_by' => $log->performer 
                            ? trim($log->performer->first_name . ' ' . $log->performer->last_name)
                            : 'System',
                        'performed_by_role' => $log->performed_by_role,
                        'reason' => $log->reason,
                        'metadata' => $log->metadata,
                        'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json([
                'status' => 200,
                'logs' => $logs,
            ]);
        } catch (\Exception $e) {
            Log::error('Get logs error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get logs',
            ], 500);
        }
    }

    /**
     * Get doctors in branch
     */
    public function getDoctors(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch not assigned',
                ], 400);
            }

            $doctors = DB::table('doctor_schedules')
                ->join('users', 'doctor_schedules.doctor_id', '=', 'users.id')
                ->leftJoin('doctors', 'users.id', '=', 'doctors.user_id')
                ->where('doctor_schedules.branch_id', $branchId)
                ->where('doctor_schedules.status', 'active')
                ->select([
                    'users.id as doctor_id',
                    'users.first_name',
                    'users.last_name',
                    'users.profile_picture',
                    'doctors.areas_of_specialization as specialization',
                ])
                ->distinct()
                ->get()
                ->map(function ($doc) {
                    return [
                        'doctor_id' => $doc->doctor_id,
                        'name' => trim($doc->first_name . ' ' . $doc->last_name),
                        'profile_picture' => $doc->profile_picture,
                        'specialization' => $doc->specialization,
                    ];
                });

            return response()->json([
                'status' => 200,
                'doctors' => $doctors,
            ]);
        } catch (\Exception $e) {
            Log::error('Get doctors error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get doctors',
            ], 500);
        }
    }

    /**
     * Get dashboard overview with alerts
     */
    public function getDashboard(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch not assigned',
                ], 400);
            }

            $today = now()->toDateString();
            $tomorrow = now()->addDay()->toDateString();

            // Today's appointments summary
            $todayAppointments = AppointmentBooking::forBranch($branchId)
                ->forDate($today)
                ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                ->with(['doctor', 'patient'])
                ->orderBy('appointment_time')
                ->get()
                ->map(fn($apt) => $this->formatAppointmentForList($apt));

            // Upcoming appointments (next 7 days excluding today)
            $upcomingAppointments = AppointmentBooking::forBranch($branchId)
                ->where('appointment_date', '>', $today)
                ->where('appointment_date', '<=', now()->addDays(7)->toDateString())
                ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                ->with(['doctor', 'patient'])
                ->orderBy('appointment_date')
                ->orderBy('appointment_time')
                ->limit(20)
                ->get()
                ->map(fn($apt) => $this->formatAppointmentForList($apt));

            // Recent cancelled/rescheduled appointments
            $recentCancelled = AppointmentBooking::forBranch($branchId)
                ->whereIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                ->where('updated_at', '>=', now()->subDays(7))
                ->with(['doctor', 'patient'])
                ->orderByDesc('updated_at')
                ->limit(10)
                ->get()
                ->map(fn($apt) => $this->formatAppointmentForList($apt));

            // Alerts
            $alerts = [];

            // Doctor cancellation alerts (appointments cancelled for doctor unavailability)
            $doctorCancellations = AppointmentBooking::forBranch($branchId)
                ->where('cancelled_by_admin_for_doctor', true)
                ->where('cancelled_at', '>=', now()->subDays(3))
                ->with(['doctor', 'patient'])
                ->get();

            foreach ($doctorCancellations as $apt) {
                $alerts[] = [
                    'type' => 'doctor_cancellation',
                    'severity' => 'warning',
                    'title' => 'Doctor Unavailability Cancellation',
                    'message' => "Appointment for {$apt->patient->first_name} {$apt->patient->last_name} with Dr. {$apt->doctor->first_name} {$apt->doctor->last_name} was cancelled due to doctor unavailability.",
                    'appointment_id' => $apt->id,
                    'created_at' => $apt->cancelled_at,
                ];
            }

            // Fully booked sessions for tomorrow
            $tomorrowSchedules = DB::table('doctor_schedules')
                ->join('users', 'doctor_schedules.doctor_id', '=', 'users.id')
                ->where('doctor_schedules.branch_id', $branchId)
                ->where('doctor_schedules.status', 'active')
                ->where('doctor_schedules.schedule_day', Carbon::parse($tomorrow)->format('l'))
                ->select([
                    'doctor_schedules.*',
                    'users.first_name',
                    'users.last_name',
                ])
                ->get();

            foreach ($tomorrowSchedules as $schedule) {
                $bookedCount = AppointmentBooking::where('doctor_id', $schedule->doctor_id)
                    ->where('branch_id', $branchId)
                    ->whereDate('appointment_date', $tomorrow)
                    ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                    ->count();

                if ($bookedCount >= $schedule->max_patients) {
                    $alerts[] = [
                        'type' => 'fully_booked',
                        'severity' => 'info',
                        'title' => 'Fully Booked Session',
                        'message' => "Dr. {$schedule->first_name} {$schedule->last_name}'s session tomorrow ({$tomorrow}) is fully booked ({$bookedCount}/{$schedule->max_patients} slots).",
                        'doctor_id' => $schedule->doctor_id,
                        'date' => $tomorrow,
                    ];
                }
            }

            // Pending payments
            $pendingPayments = AppointmentBooking::forBranch($branchId)
                ->where('appointment_date', '>=', $today)
                ->where('payment_status', AppointmentBooking::PAYMENT_PENDING)
                ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED])
                ->count();

            if ($pendingPayments > 0) {
                $alerts[] = [
                    'type' => 'pending_payments',
                    'severity' => 'warning',
                    'title' => 'Pending Payments',
                    'message' => "{$pendingPayments} upcoming appointment(s) have pending payments.",
                    'count' => $pendingPayments,
                ];
            }

            // Summary counts
            $summary = [
                'today_total' => $todayAppointments->count(),
                'today_confirmed' => $todayAppointments->where('status', 'confirmed')->count(),
                'today_checked_in' => $todayAppointments->where('status', 'checked_in')->count(),
                'today_in_session' => $todayAppointments->where('status', 'in_session')->count(),
                'today_completed' => $todayAppointments->where('status', 'completed')->count(),
                'upcoming_count' => $upcomingAppointments->count(),
                'pending_payments' => $pendingPayments,
                'alerts_count' => count($alerts),
            ];

            return response()->json([
                'status' => 200,
                'summary' => $summary,
                'today_appointments' => $todayAppointments,
                'upcoming_appointments' => $upcomingAppointments,
                'recent_cancelled' => $recentCancelled,
                'alerts' => $alerts,
            ]);
        } catch (\Exception $e) {
            Log::error('Get dashboard error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get dashboard data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single appointment details
     */
    public function getAppointmentDetails(string $bookingId): JsonResponse
    {
        try {
            $booking = AppointmentBooking::with(['doctor', 'patient', 'branch', 'logs.performer'])
                ->find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Appointment not found',
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'appointment' => [
                    'id' => $booking->id,
                    'patient' => [
                        'id' => $booking->patient_id,
                        'name' => $booking->patient ? trim($booking->patient->first_name . ' ' . $booking->patient->last_name) : 'N/A',
                        'phone' => $booking->patient->phone_number ?? null,
                        'email' => $booking->patient->email ?? null,
                    ],
                    'doctor' => [
                        'id' => $booking->doctor_id,
                        'name' => $booking->doctor ? trim($booking->doctor->first_name . ' ' . $booking->doctor->last_name) : 'N/A',
                    ],
                    'branch' => [
                        'id' => $booking->branch_id,
                        'name' => $booking->branch->center_name ?? 'N/A',
                    ],
                    'appointment_date' => $booking->appointment_date->format('Y-m-d'),
                    'appointment_time' => Carbon::parse($booking->appointment_time)->format('h:i A'),
                    'slot_number' => $booking->slot_number,
                    'token_number' => $booking->token_number,
                    'appointment_type' => $booking->appointment_type,
                    'booking_type' => $booking->booking_type,
                    'status' => $booking->status,
                    'payment_status' => $booking->payment_status,
                    'payment_method' => $booking->payment_method,
                    'booking_fee' => $booking->booking_fee,
                    'amount_paid' => $booking->amount_paid,
                    'notes' => $booking->notes,
                    'cancellation_reason' => $booking->cancellation_reason,
                    'cancelled_by_admin_for_doctor' => $booking->cancelled_by_admin_for_doctor,
                    'reschedule_count' => $booking->reschedule_count,
                    'patient_reschedule_count' => $booking->patient_reschedule_count,
                    'admin_granted_reschedule_count' => $booking->admin_granted_reschedule_count,
                    'created_at' => $booking->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $booking->updated_at->format('Y-m-d H:i:s'),
                    'logs' => $booking->logs->map(fn($log) => [
                        'id' => $log->id,
                        'action' => $log->action,
                        'action_label' => $log->getActionLabel(),
                        'performed_by' => $log->performer ? trim($log->performer->first_name . ' ' . $log->performer->last_name) : 'System',
                        'performed_by_role' => $log->performed_by_role,
                        'reason' => $log->reason,
                        'previous_status' => $log->previous_status,
                        'new_status' => $log->new_status,
                        'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                    ]),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get appointment details error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get appointment details',
            ], 500);
        }
    }

    /**
     * Create appointment on behalf of patient (walk-in / phone booking)
     */
    public function createAppointment(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|string',
                'doctor_id' => 'required|string|exists:users,id',
                'appointment_date' => 'required|date|after_or_equal:today',
                'slot_number' => 'required|integer|min:1',
                'booking_type' => 'required|in:walk_in,phone,online',
                'payment_status' => 'required|in:pending,paid,waived',
                'payment_method' => 'nullable|string',
                'amount_paid' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string|max:1000',
            ]);

            $user = $request->user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch not assigned',
                ], 400);
            }

            $doctorId = $validated['doctor_id'];
            $date = $validated['appointment_date'];
            $slotNumber = $validated['slot_number'];

            // Check slot availability
            if (!AppointmentBooking::isSlotAvailable($doctorId, $date, $slotNumber)) {
                return response()->json([
                    'status' => 400,
                    'message' => 'The selected slot is not available',
                ], 400);
            }

            // Get schedule for appointment time calculation
            $dayOfWeek = Carbon::parse($date)->format('l');
            $schedule = DB::table('doctor_schedules')
                ->where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->where('schedule_day', $dayOfWeek)
                ->where('status', 'active')
                ->first();

            if (!$schedule) {
                return response()->json([
                    'status' => 400,
                    'message' => 'No active schedule found for this doctor on the selected date',
                ], 400);
            }

            // Calculate appointment time
            $startTime = Carbon::parse($schedule->start_time);
            $timePerPatient = $schedule->time_per_patient ?? 15;
            $appointmentTime = $startTime->addMinutes(($slotNumber - 1) * $timePerPatient)->format('H:i:s');

            // Get token number
            $tokenNumber = AppointmentBooking::getNextTokenNumber($doctorId, $branchId, $date);

            // Get settings for default fee
            $settings = AppointmentSettings::getForBranch($branchId);
            $bookingFee = $validated['booking_type'] === 'walk_in' 
                ? ($settings->walk_in_fee ?? $settings->default_booking_fee)
                : $settings->default_booking_fee;

            DB::beginTransaction();

            $booking = AppointmentBooking::create([
                'patient_id' => $validated['patient_id'],
                'doctor_id' => $doctorId,
                'branch_id' => $branchId,
                'schedule_id' => $schedule->id,
                'appointment_date' => $date,
                'appointment_time' => $appointmentTime,
                'slot_number' => $slotNumber,
                'token_number' => $tokenNumber,
                'appointment_type' => 'consultation',
                'booking_type' => $validated['booking_type'],
                'status' => AppointmentBooking::STATUS_CONFIRMED,
                'payment_status' => $validated['payment_status'],
                'payment_method' => data_get($validated, 'payment_method', 'cash'),
                'booking_fee' => $bookingFee,
                'amount_paid' => data_get($validated, 'amount_paid', $validated['payment_status'] === 'paid' ? $bookingFee : 0),
                'payment_date' => $validated['payment_status'] === 'paid' ? now() : null,
                'booked_by' => $user->id,
                'booked_by_role' => AppointmentLog::ROLE_BRANCH_ADMIN,
                'notes' => data_get($validated, 'notes'),
            ]);

            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_CREATED,
                $user->id,
                AppointmentLog::ROLE_BRANCH_ADMIN,
                null,
                AppointmentBooking::STATUS_CONFIRMED,
                "Created by Branch Admin - {$validated['booking_type']} booking",
                [
                    'booking_type' => $validated['booking_type'],
                    'payment_status' => $validated['payment_status'],
                ]
            );

            DB::commit();

            // Send notifications to Patient, Doctor, and Receptionists
            $creatorName = "{$user->first_name} {$user->last_name}";
            AppointmentNotificationService::notifyAppointmentCreated(
                $booking->id,
                $creatorName,
                $validated['booking_type']
            );

            return response()->json([
                'status' => 201,
                'message' => 'Appointment created successfully',
                'appointment' => [
                    'id' => $booking->id,
                    'token_number' => $booking->token_number,
                    'appointment_date' => $booking->appointment_date->format('Y-m-d'),
                    'appointment_time' => Carbon::parse($booking->appointment_time)->format('h:i A'),
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create appointment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin reschedule appointment - no restrictions
     */
    public function rescheduleAppointment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'new_date' => 'required|date|after_or_equal:today',
                'new_slot_number' => 'required|integer|min:1',
                'new_doctor_id' => 'nullable|string|exists:users,id',
                'new_branch_id' => 'nullable|string|exists:branches,id',
                'reason' => 'required|string|max:500',
            ]);

            $user = $request->user();
            $branchId = $user->branch_id;

            // Security: Verify branch ownership
            if (!$branchId) {
                return response()->json([
                    'status' => 403,
                    'message' => 'Branch not assigned',
                ], 403);
            }

            $booking = AppointmentBooking::where('id', $bookingId)
                ->where('branch_id', $branchId)
                ->first();

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found or access denied',
                ], 404);
            }

            if (!$booking->canBeRescheduled()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This appointment cannot be rescheduled. Only confirmed appointments can be rescheduled.',
                ], 400);
            }

            // Determine target values
            $newDoctorId = $validated['new_doctor_id'] ?? $booking->doctor_id;
            $newBranchId = $validated['new_branch_id'] ?? $booking->branch_id;
            $newDate = $validated['new_date'];
            $newSlotNumber = $validated['new_slot_number'];

            // Start transaction early to lock the slot check
            DB::beginTransaction();

            // Check slot availability with lock (exclude current booking)
            $existingBooking = AppointmentBooking::where('doctor_id', $newDoctorId)
                ->whereDate('appointment_date', $newDate)
                ->where('slot_number', $newSlotNumber)
                ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                ->where('id', '!=', $booking->id)
                ->lockForUpdate()
                ->first();

            if ($existingBooking) {
                DB::rollBack();
                return response()->json([
                    'status' => 409,
                    'message' => 'The selected slot is already booked. Please select a different slot.',
                ], 409);
            }

            // Get schedule for new appointment time
            $dayOfWeek = Carbon::parse($newDate)->format('l');
            $schedule = DB::table('doctor_schedules')
                ->where('doctor_id', $newDoctorId)
                ->where('branch_id', $newBranchId)
                ->where('schedule_day', $dayOfWeek)
                ->where('status', 'active')
                ->first();

            if (!$schedule) {
                DB::rollBack();
                return response()->json([
                    'status' => 400,
                    'message' => 'No active schedule found for this doctor on the selected date',
                ], 400);
            }

            // Calculate new appointment time
            $startTime = Carbon::parse($schedule->start_time);
            $timePerPatient = $schedule->time_per_patient ?? 15;
            $newAppointmentTime = $startTime->addMinutes(($newSlotNumber - 1) * $timePerPatient)->format('H:i:s');

            // Get new token number
            $newTokenNumber = AppointmentBooking::getNextTokenNumber($newDoctorId, $newBranchId, $newDate);

            $previousData = [
                'doctor_id' => $booking->doctor_id,
                'branch_id' => $booking->branch_id,
                'appointment_date' => $booking->appointment_date->format('Y-m-d'),
                'appointment_time' => $booking->appointment_time,
                'slot_number' => $booking->slot_number,
            ];

            // Mark old booking as rescheduled
            $booking->update([
                'status' => AppointmentBooking::STATUS_RESCHEDULED,
            ]);

            // Create new booking
            $newBooking = AppointmentBooking::create([
                'patient_id' => $booking->patient_id,
                'doctor_id' => $newDoctorId,
                'branch_id' => $newBranchId,
                'schedule_id' => $schedule->id,
                'appointment_date' => $newDate,
                'appointment_time' => $newAppointmentTime,
                'slot_number' => $newSlotNumber,
                'token_number' => $newTokenNumber,
                'appointment_type' => $booking->appointment_type,
                'booking_type' => $booking->booking_type,
                'status' => AppointmentBooking::STATUS_CONFIRMED,
                'payment_status' => $booking->payment_status,
                'payment_method' => $booking->payment_method,
                'payment_id' => $booking->payment_id,
                'booking_fee' => $booking->booking_fee,
                'amount_paid' => $booking->amount_paid,
                'payment_date' => $booking->payment_date,
                'booked_by' => $user->id,
                'booked_by_role' => AppointmentLog::ROLE_BRANCH_ADMIN,
                'reschedule_count' => ($booking->reschedule_count ?? 0) + 1,
                'original_appointment_id' => $booking->original_appointment_id ?? $booking->id,
            ]);

            // Log on old booking
            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_RESCHEDULED,
                $user->id,
                AppointmentLog::ROLE_BRANCH_ADMIN,
                $booking->status,
                AppointmentBooking::STATUS_RESCHEDULED,
                $validated['reason'],
                [
                    'new_booking_id' => $newBooking->id,
                    'new_date' => $newDate,
                    'new_slot' => $newSlotNumber,
                    'rescheduled_by_admin' => true,
                ]
            );

            // Log on new booking
            AppointmentLog::log(
                $newBooking->id,
                AppointmentLog::ACTION_CREATED,
                $user->id,
                AppointmentLog::ROLE_BRANCH_ADMIN,
                null,
                AppointmentBooking::STATUS_CONFIRMED,
                "Rescheduled from appointment #{$booking->token_number}",
                [
                    'original_booking_id' => $booking->id,
                    'previous_data' => $previousData,
                    'rescheduled_by_admin' => true,
                ]
            );

            DB::commit();

            // Send notifications to Patient, Doctor, and Receptionists
            $reschedulerName = "{$user->first_name} {$user->last_name}";
            AppointmentNotificationService::notifyAppointmentRescheduled(
                $newBooking->id,
                $reschedulerName,
                $previousData['appointment_date'],
                $previousData['appointment_time'],
                $validated['reason']
            );

            // Send SMS notification to patient about the reschedule
            try {
                $smsService = new \App\Services\AppointmentSmsService();
                $patientPhone = \App\Services\AppointmentSmsService::getPatientPhoneFromBooking($newBooking);
                
                if ($patientPhone) {
                    $smsDetails = \App\Services\AppointmentSmsService::getAppointmentDetailsForSms($newBooking);
                    $smsDetails['old_date'] = $previousData['appointment_date'];
                    $smsDetails['new_date'] = $newBooking->appointment_date->format('Y-m-d');
                    $smsDetails['new_time'] = Carbon::parse($newBooking->appointment_time)->format('h:i A');
                    $smsDetails['new_token'] = $newBooking->token_number;
                    
                    $smsService->sendRescheduleSms($newBooking, $patientPhone, $smsDetails);
                }
            } catch (\Exception $smsEx) {
                Log::warning('Reschedule SMS notification failed: ' . $smsEx->getMessage());
                // SMS failure should not affect the reschedule operation
            }

            return response()->json([
                'status' => 200,
                'message' => 'Appointment rescheduled successfully',
                'old_booking_id' => $booking->id,
                'new_booking' => [
                    'id' => $newBooking->id,
                    'token_number' => $newBooking->token_number,
                    'appointment_date' => $newBooking->appointment_date->format('Y-m-d'),
                    'appointment_time' => Carbon::parse($newBooking->appointment_time)->format('h:i A'),
                ],
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            // Handle UNIQUE constraint violation
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed') || 
                str_contains($e->getMessage(), 'Duplicate entry') ||
                $e->getCode() === '23000') {
                Log::warning('Reschedule slot conflict: ' . $e->getMessage());
                return response()->json([
                    'status' => 409,
                    'message' => 'This slot has just been booked by another user. Please select a different slot.',
                ], 409);
            }
            Log::error('Admin reschedule error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to reschedule appointment',
                'error' => $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Admin reschedule error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to reschedule appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available slots for a doctor on a specific date
     */
    public function getAvailableSlots(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'doctor_id' => 'required|string',
                'date' => 'required|date',
            ]);

            $user = $request->user();
            $branchId = $user->branch_id;

            $doctorId = $validated['doctor_id'];
            $date = $validated['date'];
            $dayOfWeek = Carbon::parse($date)->format('l');

            // Get doctor's schedule
            $schedule = DB::table('doctor_schedules')
                ->where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->where('schedule_day', $dayOfWeek)
                ->where('status', 'active')
                ->first();

            if (!$schedule) {
                return response()->json([
                    'status' => 200,
                    'slots' => [],
                    'message' => 'No schedule found for this date',
                ]);
            }

            // Get booked slots
            $bookedSlots = AppointmentBooking::where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->whereDate('appointment_date', $date)
                ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                ->pluck('slot_number')
                ->toArray();

            // Build slots array
            $slots = [];
            $startTime = Carbon::parse($schedule->start_time);
            $timePerPatient = $schedule->time_per_patient ?? 15;
            $maxPatients = $schedule->max_patients ?? 20;

            for ($i = 1; $i <= $maxPatients; $i++) {
                $slotTime = $startTime->copy()->addMinutes(($i - 1) * $timePerPatient);
                $slots[] = [
                    'slot_number' => $i,
                    'time' => $slotTime->format('h:i A'),
                    'is_available' => !in_array($i, $bookedSlots),
                ];
            }

            return response()->json([
                'status' => 200,
                'slots' => $slots,
                'schedule' => [
                    'start_time' => Carbon::parse($schedule->start_time)->format('h:i A'),
                    'end_time' => Carbon::parse($schedule->end_time)->format('h:i A'),
                    'max_patients' => $maxPatients,
                    'booked_count' => count($bookedSlots),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get available slots error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get available slots',
            ], 500);
        }
    }

    /**
     * Search patients for booking
     */
    public function searchPatients(Request $request): JsonResponse
    {
        try {
            $query = $request->query('q', '');

            if (strlen($query) < 2) {
                return response()->json([
                    'status' => 200,
                    'patients' => [],
                ]);
            }

            $patients = DB::table('patients')
                ->where(function ($q) use ($query) {
                    $q->where('first_name', 'like', "%{$query}%")
                      ->orWhere('last_name', 'like', "%{$query}%")
                      ->orWhere('phone_number', 'like', "%{$query}%")
                      ->orWhere('email', 'like', "%{$query}%")
                      ->orWhere('id', 'like', "%{$query}%");
                })
                ->select(['id', 'user_id', 'first_name', 'last_name', 'phone_number', 'email', 'date_of_birth'])
                ->limit(20)
                ->get()
                ->map(fn($p) => [
                    'id' => $p->user_id ?? $p->id,
                    'name' => trim($p->first_name . ' ' . $p->last_name),
                    'phone' => $p->phone_number,
                    'email' => $p->email,
                    'dob' => $p->date_of_birth,
                ]);

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
     * Update appointment status (confirm, complete, no-show)
     */
    public function updateStatus(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:confirmed,completed,no_show,checked_in,in_session',
                'reason' => 'required|string|max:500',
            ]);

            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            $user = $request->user();
            $previousStatus = $booking->status;

            DB::beginTransaction();

            $updates = ['status' => $validated['status']];

            // Set timestamps based on status
            switch ($validated['status']) {
                case 'checked_in':
                    $updates['checked_in_at'] = now();
                    break;
                case 'in_session':
                    $updates['session_started_at'] = now();
                    break;
                case 'completed':
                    $updates['completed_at'] = now();
                    break;
            }

            $booking->update($updates);

            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_STATUS_CHANGED,
                $user->id,
                AppointmentLog::ROLE_BRANCH_ADMIN,
                $previousStatus,
                $validated['status'],
                $validated['reason']
            );

            DB::commit();

            // Send SMS notification for significant status changes (no_show, checked_in, completed)
            $notifiableStatuses = ['no_show', 'checked_in', 'completed'];
            if (in_array($validated['status'], $notifiableStatuses)) {
                try {
                    $smsService = new \App\Services\AppointmentSmsService();
                    $patientPhone = \App\Services\AppointmentSmsService::getPatientPhoneFromBooking($booking);
                    
                    if ($patientPhone) {
                        $smsDetails = \App\Services\AppointmentSmsService::getAppointmentDetailsForSms($booking);
                        $smsService->sendStatusUpdateSms($booking, $patientPhone, $validated['status'], $smsDetails);
                    }
                } catch (\Exception $smsEx) {
                    Log::warning('Status update SMS notification failed: ' . $smsEx->getMessage());
                    // SMS failure should not affect the status update
                }
            }

            return response()->json([
                'status' => 200,
                'message' => 'Status updated successfully',
                'new_status' => $validated['status'],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update status error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update status',
            ], 500);
        }
    }

    /**
     * Update payment status for an appointment
     * Branch Admin can mark as paid, pending, or waived
     */
    public function updatePaymentStatus(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_status' => 'required|in:pending,paid,waived',
                'payment_method' => 'nullable|string|max:50',
                'amount_paid' => 'nullable|numeric|min:0',
                'reason' => 'required|string|max:500',
            ]);

            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            $user = $request->user();
            $previousPaymentStatus = $booking->payment_status;

            DB::beginTransaction();

            $updates = [
                'payment_status' => $validated['payment_status'],
            ];

            if ($validated['payment_status'] === 'paid') {
                $updates['payment_method'] = data_get($validated, 'payment_method', 'cash');
                $updates['amount_paid'] = data_get($validated, 'amount_paid', $booking->booking_fee);
                $updates['payment_date'] = now();
                
                // If appointment was pending payment, confirm it
                if ($booking->status === AppointmentBooking::STATUS_PENDING_PAYMENT) {
                    $updates['status'] = AppointmentBooking::STATUS_CONFIRMED;
                }
            }

            $booking->update($updates);

            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_PAYMENT_UPDATED,
                $user->id,
                AppointmentLog::ROLE_BRANCH_ADMIN,
                $previousPaymentStatus,
                $validated['payment_status'],
                $validated['reason'],
                [
                    'payment_method' => data_get($validated, 'payment_method'),
                    'amount_paid' => data_get($validated, 'amount_paid'),
                ]
            );

            DB::commit();

            return response()->json([
                'status' => 200,
                'message' => 'Payment status updated successfully',
                'new_payment_status' => $validated['payment_status'],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update payment status error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update payment status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Helper: Format appointment for list display
     */
    private function formatAppointmentForList(AppointmentBooking $apt): array
    {
        return [
            'id' => $apt->id,
            'patient_id' => $apt->patient_id,
            'patient_name' => $apt->patient ? trim($apt->patient->first_name . ' ' . $apt->patient->last_name) : 'N/A',
            'patient_phone' => $apt->patient->phone_number ?? null,
            'doctor_id' => $apt->doctor_id,
            'doctor_name' => $apt->doctor ? trim($apt->doctor->first_name . ' ' . $apt->doctor->last_name) : 'N/A',
            'appointment_date' => $apt->appointment_date->format('Y-m-d'),
            'appointment_time' => Carbon::parse($apt->appointment_time)->format('h:i A'),
            'token_number' => $apt->token_number,
            'slot_number' => $apt->slot_number,
            'status' => $apt->status,
            'payment_status' => $apt->payment_status,
            'booking_type' => $apt->booking_type,
            'cancellation_reason' => $apt->cancellation_reason,
        ];
    }

    /**
     * Register a new patient for walk-in/phone appointment booking
     * Auto-generates username and password, sends SMS with credentials
     * 
     * Required: full_name, mobile_number, gender
     * Optional: nic, date_of_birth, address
     */
    public function registerPatientForAppointment(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'full_name' => 'required|string|max:255|min:2',
                'mobile_number' => 'required|string|max:20|min:9',
                'nic' => 'nullable|string|max:20',
                'gender' => 'required|in:male,female,other',
                'date_of_birth' => 'nullable|date|before:today',
                'address' => 'nullable|string|max:500',
                'send_sms' => 'nullable|boolean',
            ]);

            $user = $request->user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Branch not assigned to admin',
                ], 400);
            }

            // Clean mobile number - remove spaces and special chars
            $mobileNumber = preg_replace('/[^0-9+]/', '', $validated['mobile_number']);
            
            // Ensure mobile starts with 0 or +94 for Sri Lankan numbers
            if (!preg_match('/^(0|\+94)[0-9]{9}$/', $mobileNumber)) {
                // Try to normalize: if 9 digits, prepend 0
                if (strlen($mobileNumber) === 9 && ctype_digit($mobileNumber)) {
                    $mobileNumber = '0' . $mobileNumber;
                }
            }

            // Check if phone number already exists in patients table
            $existingPatient = DB::table('patients')
                ->where(function($q) use ($mobileNumber) {
                    $q->where('phone', $mobileNumber)
                      ->orWhere('phone_number', $mobileNumber);
                })
                ->first();

            if ($existingPatient) {
                return response()->json([
                    'status' => 409,
                    'message' => 'A patient with this mobile number already exists',
                    'existing_patient' => [
                        'id' => $existingPatient->user_id ?? $existingPatient->id,
                        'name' => $existingPatient->name ?? ($existingPatient->first_name . ' ' . $existingPatient->last_name),
                        'patient_id' => $existingPatient->patient_id,
                    ],
                ], 409);
            }

            // Check if phone exists in users table
            $existingUser = DB::table('users')
                ->where('phone', $mobileNumber)
                ->first();

            if ($existingUser) {
                // Check if this user has a patient record
                $patientRecord = DB::table('patients')
                    ->where('user_id', $existingUser->id)
                    ->first();
                
                if ($patientRecord) {
                    return response()->json([
                        'status' => 409,
                        'message' => 'A patient with this mobile number already exists',
                        'existing_patient' => [
                            'id' => $existingUser->id,
                            'name' => $patientRecord->name ?? ($patientRecord->first_name . ' ' . $patientRecord->last_name),
                            'patient_id' => $patientRecord->patient_id,
                        ],
                    ], 409);
                }
                
                return response()->json([
                    'status' => 409,
                    'message' => 'This mobile number is already registered in the system as a non-patient user',
                ], 409);
            }

            DB::beginTransaction();

            // Parse name into first and last name
            $nameParts = explode(' ', trim($validated['full_name']), 2);
            $firstName = $nameParts[0];
            $lastName = isset($nameParts[1]) ? $nameParts[1] : '';

            // Generate username: pt_<phone_last_10_digits>
            $phoneDigits = preg_replace('/[^0-9]/', '', $mobileNumber);
            $username = 'pt_' . substr($phoneDigits, -10);

            // Check if username exists and make unique if needed
            $usernameBase = $username;
            $counter = 1;
            while (DB::table('users')->where('email', $username . '@patient.local')->exists()) {
                $username = $usernameBase . '_' . $counter;
                $counter++;
            }

            // Generate secure 8-character password
            // Allowed chars: a-z (excluding i,l,j), A-Z (excluding O), 1-9 (excluding 0)
            $password = $this->generateSecurePassword(8);

            // Create user account
            $userId = (string) \Illuminate\Support\Str::uuid();
            DB::table('users')->insert([
                'id' => $userId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $username . '@patient.local',
                'phone' => $mobileNumber,
                'password' => bcrypt($password),
                'role_as' => 6, // Patient role
                'user_type' => 'Patient',
                'branch_id' => $branchId,
                'gender' => $validated['gender'],
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'address' => $validated['address'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Generate unique patient ID
            $lastPatient = DB::table('patients')
                ->where('branch_id', $branchId)
                ->orderBy('id', 'desc')
                ->first();
            
            $patientNumber = $lastPatient ? ($lastPatient->id + 1) : 1;
            $patientId = 'PT-' . str_pad($branchId, 2, '0', STR_PAD_LEFT) . '-' . str_pad($patientNumber, 5, '0', STR_PAD_LEFT);

            // Create patient record
            $patientRecordId = DB::table('patients')->insertGetId([
                'patient_id' => $patientId,
                'user_id' => $userId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'name' => $validated['full_name'],
                'phone' => $mobileNumber,
                'phone_number' => $mobileNumber,
                'email' => $username . '@patient.local',
                'date_of_birth' => $validated['date_of_birth'] ?? now()->subYears(30)->format('Y-m-d'),
                'gender' => $validated['gender'],
                'address' => $validated['address'] ?? 'Not provided',
                'city' => 'Not specified',
                'nic' => $validated['nic'] ?? null,
                'branch_id' => $branchId,
                'center_id' => 1,
                'unique_registration_number' => $patientId,
                'registered_by' => $user->id,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            // Get branch info for SMS
            $branch = DB::table('branches')
                ->where('id', $branchId)
                ->select('center_name', 'name')
                ->first();
            $branchName = $branch->center_name ?? $branch->name ?? 'CURE Health';

            // Send SMS with credentials if requested (default: true)
            $smsSent = false;
            $smsMessage = '';
            if ($validated['send_sms'] ?? true) {
                try {
                    $smsService = new \App\Services\AppointmentSmsService();
                    $smsSent = $smsService->sendPatientCredentialsSms(
                        $mobileNumber,
                        $username,
                        $password,
                        $branchName,
                        $validated['full_name']
                    );
                } catch (\Exception $smsError) {
                    Log::warning('Failed to send patient credentials SMS: ' . $smsError->getMessage());
                }
            }

            // Log the action
            Log::info('New patient registered for appointment', [
                'patient_id' => $patientId,
                'user_id' => $userId,
                'registered_by' => $user->id,
                'branch_id' => $branchId,
                'sms_sent' => $smsSent,
            ]);

            return response()->json([
                'status' => 201,
                'message' => 'Patient registered successfully',
                'patient' => [
                    'id' => $userId,
                    'patient_record_id' => $patientRecordId,
                    'patient_id' => $patientId,
                    'name' => $validated['full_name'],
                    'phone' => $mobileNumber,
                    'username' => $username,
                    // Only include password in response for display purposes
                    // In production, you might want to remove this
                    'temp_password' => $password,
                ],
                'sms_sent' => $smsSent,
                'credentials' => [
                    'username' => $username,
                    'password' => $password,
                    'login_url' => config('app.url', 'https://portal.curehealth.lk') . '/login',
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Patient registration error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Failed to register patient',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate a secure password with specific character requirements
     * Excludes confusing characters: i, l, j, o, O, 0
     */
    private function generateSecurePassword(int $length = 8): string
    {
        $lowercase = 'abcdefghkmnpqrstuvwxyz'; // Excluded: i, l, j, o
        $uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded: I, O
        $numbers = '123456789'; // Excluded: 0

        // Ensure at least one of each type
        $password = '';
        $password .= $lowercase[random_int(0, strlen($lowercase) - 1)];
        $password .= $uppercase[random_int(0, strlen($uppercase) - 1)];
        $password .= $numbers[random_int(0, strlen($numbers) - 1)];

        // Fill remaining characters
        $allChars = $lowercase . $uppercase . $numbers;
        for ($i = 3; $i < $length; $i++) {
            $password .= $allChars[random_int(0, strlen($allChars) - 1)];
        }

        // Shuffle the password
        return str_shuffle($password);
    }

    /**
     * Create appointment for newly registered patient with SMS confirmation
     * This is an enhanced version that handles the complete walk-in flow
     */
    public function createAppointmentWithPatient(Request $request): JsonResponse
    {
        try {
            // First, register the patient if new patient data is provided
            $patientId = $request->input('patient_id');
            $isNewPatient = false;
            $patientCredentials = null;

            if ($request->has('new_patient') && $request->input('new_patient')) {
                // Register new patient first
                $patientRequest = new Request($request->input('new_patient'));
                $patientRequest->setUserResolver(function () use ($request) {
                    return $request->user();
                });
                
                $patientResponse = $this->registerPatientForAppointment($patientRequest);
                $patientData = json_decode($patientResponse->getContent(), true);

                if ($patientResponse->getStatusCode() !== 201) {
                    return $patientResponse;
                }

                $patientId = $patientData['patient']['id'];
                $isNewPatient = true;
                $patientCredentials = $patientData['credentials'] ?? null;
            }

            if (!$patientId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Patient ID is required',
                ], 400);
            }

            // Merge patient_id into request and create appointment
            $request->merge(['patient_id' => $patientId]);
            $appointmentResponse = $this->createAppointment($request);
            $appointmentData = json_decode($appointmentResponse->getContent(), true);

            if ($appointmentResponse->getStatusCode() !== 201) {
                return $appointmentResponse;
            }

            // Send appointment confirmation SMS
            $booking = AppointmentBooking::find($appointmentData['appointment']['id']);
            if ($booking) {
                try {
                    $smsService = new \App\Services\AppointmentSmsService();
                    $patientPhone = \App\Services\AppointmentSmsService::getPatientPhoneFromBooking($booking);
                    $details = \App\Services\AppointmentSmsService::getAppointmentDetailsForSms($booking);
                    
                    $smsService->sendAppointmentConfirmationSms($booking, $patientPhone, $details);
                } catch (\Exception $smsError) {
                    Log::warning('Failed to send appointment confirmation SMS: ' . $smsError->getMessage());
                }
            }

            // Build response
            $response = [
                'status' => 201,
                'message' => $isNewPatient 
                    ? 'Patient registered and appointment created successfully' 
                    : 'Appointment created successfully',
                'appointment' => $appointmentData['appointment'],
                'is_new_patient' => $isNewPatient,
            ];

            if ($isNewPatient && $patientCredentials) {
                $response['patient_credentials'] = $patientCredentials;
            }

            return response()->json($response, 201);

        } catch (\Exception $e) {
            Log::error('Create appointment with patient error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
