<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Models\Appointment\AppointmentBooking;
use App\Models\Appointment\AppointmentSettings;
use App\Models\Appointment\AppointmentLog;
use App\Models\SystemSettings;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use App\Http\Controllers\Appointment\BranchAdminAppointmentController;
use App\Models\DoctorSchedule;
use Carbon\Carbon;

class SuperAdminAppointmentController extends Controller
{
    /**
     * Reference to BranchAdminAppointmentController for reusing logic
     */
    protected $branchAdminController;

    public function __construct()
    {
        $this->branchAdminController = new BranchAdminAppointmentController();
    }

    /**
     * Get all appointments across all branches
     */
    public function getAllAppointments(Request $request): JsonResponse
    {
        try {
            $date = $request->query('date');
            $branchId = $request->query('branch_id');
            $doctorId = $request->query('doctor_id');
            $status = $request->query('status', 'all');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 50);

            $query = DB::table('appointment_bookings')
                ->join('users as doctor', 'appointment_bookings.doctor_id', '=', 'doctor.id')
                ->join('branches', 'appointment_bookings.branch_id', '=', 'branches.id')
                ->leftJoin('patients', function ($join) {
                    $join->on('appointment_bookings.patient_id', '=', 'patients.user_id')
                         ->orOn('appointment_bookings.patient_id', '=', DB::raw('CAST(patients.id AS TEXT)'));
                })
                ->leftJoin('doctors', 'doctor.id', '=', 'doctors.user_id')
                ->select([
                    'appointment_bookings.*',
                    'doctor.first_name as doctor_first_name',
                    'doctor.last_name as doctor_last_name',
                    'doctors.areas_of_specialization as doctor_specialization',
                    'branches.center_name as branch_name',
                    'patients.first_name as patient_first_name',
                    'patients.last_name as patient_last_name',
                    'patients.phone_number as patient_phone',
                ])
                ->orderBy('appointment_bookings.appointment_date', 'desc')
                ->orderBy('appointment_bookings.appointment_time', 'asc');

            // Filters
            if ($branchId) {
                $query->where('appointment_bookings.branch_id', $branchId);
            }

            if ($date) {
                $query->whereDate('appointment_bookings.appointment_date', $date);
            }

            if ($startDate && $endDate) {
                $query->whereBetween('appointment_bookings.appointment_date', [$startDate, $endDate]);
            }

            if ($doctorId) {
                $query->where('appointment_bookings.doctor_id', $doctorId);
            }

            if ($status !== 'all') {
                $query->where('appointment_bookings.status', $status);
            }

            $total = $query->count();
            $appointments = $query->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get()
                ->map(function ($apt) {
                    return [
                        'id' => $apt->id,
                        'patient_id' => $apt->patient_id,
                        'patient_name' => trim(($apt->patient_first_name ?? '') . ' ' . ($apt->patient_last_name ?? '')),
                        'patient_phone' => $apt->patient_phone,
                        'doctor_id' => $apt->doctor_id,
                        'doctor_name' => trim(($apt->doctor_first_name ?? '') . ' ' . ($apt->doctor_last_name ?? '')),
                        'specialization' => $apt->doctor_specialization ?? 'General',
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
                        'payment_method' => $apt->payment_method,
                        'booking_fee' => $apt->booking_fee,
                        'amount_paid' => $apt->amount_paid,
                        'created_at' => $apt->created_at,
                    ];
                });

            return response()->json([
                'status' => 200,
                'appointments' => $appointments,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => ceil($total / $perPage),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get all appointments error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get appointments',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get cross-branch statistics
     */
    public function getGlobalStatistics(Request $request): JsonResponse
    {
        try {
            $today = now()->toDateString();
            $thisWeekStart = now()->startOfWeek()->toDateString();
            $thisWeekEnd = now()->endOfWeek()->toDateString();
            $thisMonthStart = now()->startOfMonth()->toDateString();
            $thisMonthEnd = now()->endOfMonth()->toDateString();
            $lastMonthStart = now()->subMonth()->startOfMonth()->toDateString();
            $lastMonthEnd = now()->subMonth()->endOfMonth()->toDateString();

            // Global stats
            $stats = [
                'today' => [
                    'total' => AppointmentBooking::whereDate('appointment_date', $today)
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                        ->count(),
                    'confirmed' => AppointmentBooking::whereDate('appointment_date', $today)
                        ->where('status', AppointmentBooking::STATUS_CONFIRMED)
                        ->count(),
                    'completed' => AppointmentBooking::whereDate('appointment_date', $today)
                        ->where('status', AppointmentBooking::STATUS_COMPLETED)
                        ->count(),
                    'cancelled' => AppointmentBooking::whereDate('appointment_date', $today)
                        ->where('status', AppointmentBooking::STATUS_CANCELLED)
                        ->count(),
                ],
                'this_month' => [
                    'total' => AppointmentBooking::whereBetween('appointment_date', [$thisMonthStart, $thisMonthEnd])
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                        ->count(),
                    'completed' => AppointmentBooking::whereBetween('appointment_date', [$thisMonthStart, $thisMonthEnd])
                        ->where('status', AppointmentBooking::STATUS_COMPLETED)
                        ->count(),
                    'revenue' => AppointmentBooking::whereBetween('appointment_date', [$thisMonthStart, $thisMonthEnd])
                        ->where('payment_status', AppointmentBooking::PAYMENT_PAID)
                        ->sum('amount_paid'),
                ],
                'last_month' => [
                    'total' => AppointmentBooking::whereBetween('appointment_date', [$lastMonthStart, $lastMonthEnd])
                        ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                        ->count(),
                    'completed' => AppointmentBooking::whereBetween('appointment_date', [$lastMonthStart, $lastMonthEnd])
                        ->where('status', AppointmentBooking::STATUS_COMPLETED)
                        ->count(),
                    'revenue' => AppointmentBooking::whereBetween('appointment_date', [$lastMonthStart, $lastMonthEnd])
                        ->where('payment_status', AppointmentBooking::PAYMENT_PAID)
                        ->sum('amount_paid'),
                ],
            ];

            // Calculate growth percentages
            if ($stats['last_month']['total'] > 0) {
                $stats['growth'] = [
                    'appointments' => round((($stats['this_month']['total'] - $stats['last_month']['total']) / $stats['last_month']['total']) * 100, 1),
                    'revenue' => round((($stats['this_month']['revenue'] - $stats['last_month']['revenue']) / max($stats['last_month']['revenue'], 1)) * 100, 1),
                ];
            }

            // Branch-wise breakdown
            $branchStats = DB::table('appointment_bookings')
                ->join('branches', 'appointment_bookings.branch_id', '=', 'branches.id')
                ->whereBetween('appointment_bookings.appointment_date', [$thisMonthStart, $thisMonthEnd])
                ->whereNotIn('appointment_bookings.status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED])
                ->select([
                    'branches.id as branch_id',
                    'branches.center_name as branch_name',
                    DB::raw('COUNT(*) as total_appointments'),
                    DB::raw('SUM(CASE WHEN appointment_bookings.status = "' . AppointmentBooking::STATUS_COMPLETED . '" THEN 1 ELSE 0 END) as completed'),
                    DB::raw('SUM(CASE WHEN appointment_bookings.payment_status = "' . AppointmentBooking::PAYMENT_PAID . '" THEN appointment_bookings.amount_paid ELSE 0 END) as revenue'),
                ])
                ->groupBy('branches.id', 'branches.center_name')
                ->orderByDesc('total_appointments')
                ->get();

            $stats['by_branch'] = $branchStats;

            // Today's distribution by branch
            $todayByBranch = DB::table('appointment_bookings')
                ->join('branches', 'appointment_bookings.branch_id', '=', 'branches.id')
                ->whereDate('appointment_bookings.appointment_date', $today)
                ->whereNotIn('appointment_bookings.status', [AppointmentBooking::STATUS_CANCELLED])
                ->select([
                    'branches.id as branch_id',
                    'branches.center_name as branch_name',
                    DB::raw('COUNT(*) as count'),
                ])
                ->groupBy('branches.id', 'branches.center_name')
                ->get();

            $stats['today_by_branch'] = $todayByBranch;

            return response()->json([
                'status' => 200,
                'statistics' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('Get global statistics error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all branches with their appointment settings
     */
    public function getBranchSettings(): JsonResponse
    {
        try {
            $branches = DB::table('branches')
                ->leftJoin('appointment_settings', 'branches.id', '=', 'appointment_settings.branch_id')
                ->select([
                    'branches.id as branch_id',
                    'branches.center_name as branch_name',
                    'appointment_settings.*',
                ])
                ->get()
                ->map(function ($branch) {
                    return [
                        'branch_id' => $branch->branch_id,
                        'branch_name' => $branch->branch_name,
                        'location' => null,
                        'has_settings' => !is_null($branch->id),
                        'settings' => $branch->id ? [
                            'max_advance_booking_days' => $branch->max_advance_booking_days ?? 30,
                            'min_advance_booking_hours' => $branch->min_advance_booking_hours ?? 2,
                            'allow_walk_in' => $branch->allow_walk_in ?? true,
                            'require_payment_for_online' => $branch->require_payment_for_online ?? false,
                            'default_booking_fee' => $branch->default_booking_fee ?? 0,
                            'walk_in_fee' => $branch->walk_in_fee ?? 0,
                            'allow_reschedule' => $branch->allow_reschedule ?? true,
                            'max_reschedule_count' => $branch->max_reschedule_count ?? 2,
                            'allow_patient_cancellation' => $branch->allow_patient_cancellation ?? true,
                            'refund_on_cancellation' => $branch->refund_on_cancellation ?? true,
                        ] : [
                            'max_advance_booking_days' => 30,
                            'min_advance_booking_hours' => 2,
                            'allow_walk_in' => true,
                            'require_payment_for_online' => false,
                            'default_booking_fee' => 0,
                            'walk_in_fee' => 0,
                            'allow_reschedule' => true,
                            'max_reschedule_count' => 2,
                            'allow_patient_cancellation' => true,
                            'refund_on_cancellation' => true,
                        ],
                    ];
                });

            return response()->json([
                'status' => 200,
                'branches' => $branches,
            ]);
        } catch (\Exception $e) {
            Log::error('Get branch settings error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get branch settings',
            ], 500);
        }
    }

    /**
     * Update settings for a specific branch
     */
    public function updateBranchSettings(Request $request, string $branchId): JsonResponse
    {
        try {
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

            // Check branch exists
            $branch = DB::table('branches')->where('id', $branchId)->first();
            if (!$branch) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Branch not found',
                ], 404);
            }

            $settings = AppointmentSettings::getForBranch($branchId);
            $settings->update(array_filter($validated, fn($value) => $value !== null));

            return response()->json([
                'status' => 200,
                'message' => 'Settings updated successfully',
                'settings' => $settings->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Update branch settings error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get appointment audit logs (system-wide) - STEP 12 Audit Logging
     * Log Fields: Super Admin ID, Branch, Appointment ID, Action, Timestamp
     */
    public function getAuditLogs(Request $request): JsonResponse
    {
        try {
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 50);
            $action = $request->query('action');
            $branchId = $request->query('branch_id');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $performerRole = $request->query('performed_by_role'); // Filter by role

            $query = DB::table('appointment_logs')
                ->leftJoin('appointment_bookings', 'appointment_logs.appointment_id', '=', 'appointment_bookings.id')
                ->leftJoin('branches', function ($join) {
                    // Use branch_id from log if available, otherwise from booking
                    $join->on('branches.id', '=', DB::raw('COALESCE(appointment_logs.branch_id, appointment_bookings.branch_id)'));
                })
                ->leftJoin('users as performer', 'appointment_logs.performed_by', '=', 'performer.id')
                ->select([
                    'appointment_logs.*',
                    'branches.center_name as branch_name',
                    'appointment_bookings.appointment_date',
                    'appointment_bookings.token_number',
                    'performer.first_name as performer_first_name',
                    'performer.last_name as performer_last_name',
                    'performer.email as performer_email',
                ])
                ->orderByDesc('appointment_logs.created_at');

            if ($action) {
                $query->where('appointment_logs.action', $action);
            }

            if ($branchId) {
                $query->where(function ($q) use ($branchId) {
                    $q->where('appointment_logs.branch_id', $branchId)
                      ->orWhere('appointment_bookings.branch_id', $branchId);
                });
            }

            if ($performerRole) {
                $query->where('appointment_logs.performed_by_role', $performerRole);
            }

            if ($startDate && $endDate) {
                $query->whereBetween('appointment_logs.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            }

            $total = $query->count();
            $logs = $query->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get()
                ->map(function ($log) {
                    $performerName = trim(($log->performer_first_name ?? '') . ' ' . ($log->performer_last_name ?? ''));
                    
                    return [
                        'id' => $log->id,
                        'appointment_id' => $log->appointment_id,
                        'appointment_date' => $log->appointment_date,
                        'token_number' => $log->token_number,
                        'branch_id' => $log->branch_id,
                        'branch_name' => $log->branch_name ?? 'Unknown',
                        'action' => $log->action,
                        'action_label' => ucwords(str_replace('_', ' ', $log->action)),
                        'previous_status' => $log->previous_status,
                        'new_status' => $log->new_status,
                        'performed_by' => $log->performed_by,
                        'performed_by_name' => $performerName ?: 'System',
                        'performed_by_email' => $log->performer_email,
                        'performed_by_role' => $log->performed_by_role,
                        'reason' => $log->reason,
                        'metadata' => json_decode($log->metadata, true),
                        'ip_address' => $log->ip_address,
                        'user_agent' => $log->user_agent,
                        'created_at' => $log->created_at,
                    ];
                });

            return response()->json([
                'status' => 200,
                'logs' => $logs,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => ceil($total / $perPage),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get audit logs error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get audit logs',
            ], 500);
        }
    }

    /**
     * Get all branches for filter dropdown
     */
    public function getBranches(): JsonResponse
    {
        try {
            $branches = DB::table('branches')
                ->select(['id', 'center_name as name', 'city as location', 'address'])
                ->orderBy('center_name')
                ->get();

            return response()->json([
                'status' => 200,
                'branches' => $branches,
            ]);
        } catch (\Exception $e) {
            Log::error('Get branches error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get branches',
            ], 500);
        }
    }

    /**
     * Get all doctors across all branches
     */
    public function getAllDoctors(Request $request): JsonResponse
    {
        try {
            $branchId = $request->query('branch_id');

            $query = DB::table('doctor_schedules')
                ->join('users', 'doctor_schedules.doctor_id', '=', 'users.id')
                ->join('branches', 'doctor_schedules.branch_id', '=', 'branches.id')
                ->leftJoin('doctors', 'users.id', '=', 'doctors.user_id')
                ->where('doctor_schedules.status', 'active')
                ->select([
                    'users.id as doctor_id',
                    'users.first_name',
                    'users.last_name',
                    'branches.id as branch_id',
                    'branches.center_name as branch_name',
                    'doctors.areas_of_specialization as specialization',
                ])
                ->distinct();

            if ($branchId) {
                $query->where('doctor_schedules.branch_id', $branchId);
            }

            $doctors = $query->get()->map(function ($doc) {
                return [
                    'doctor_id' => $doc->doctor_id,
                    'name' => trim($doc->first_name . ' ' . $doc->last_name),
                    'branch_id' => $doc->branch_id,
                    'branch_name' => $doc->branch_name,
                    'specialization' => $doc->specialization,
                ];
            });

            return response()->json([
                'status' => 200,
                'doctors' => $doctors,
            ]);
        } catch (\Exception $e) {
            Log::error('Get all doctors error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get doctors',
            ], 500);
        }
    }

    /**
     * Get system-wide appointment settings (booking fee, etc.)
     */
    public function getSystemSettings(): JsonResponse
    {
        try {
            $settings = [
                'booking_fee_per_slot' => SystemSettings::getBookingFeePerSlot(),
            ];

            return response()->json([
                'status' => 200,
                'settings' => $settings,
            ]);
        } catch (\Exception $e) {
            Log::error('Get system settings error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get system settings',
            ], 500);
        }
    }

    /**
     * Update system-wide appointment settings (Super Admin only)
     */
    public function updateSystemSettings(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'booking_fee_per_slot' => 'sometimes|numeric|min:0|max:100000',
            ]);

            if (isset($validated['booking_fee_per_slot'])) {
                SystemSettings::setBookingFeePerSlot((float) $validated['booking_fee_per_slot']);
            }

            return response()->json([
                'status' => 200,
                'message' => 'System settings updated successfully',
                'settings' => [
                    'booking_fee_per_slot' => SystemSettings::getBookingFeePerSlot(),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Update system settings error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update system settings',
            ], 500);
        }
    }

    /**
     * Get available slots for a doctor on a specific date (any branch)
     */
    public function getAvailableSlots(Request $request): JsonResponse
    {
        try {
            $doctorId = $request->query('doctor_id');
            $date = $request->query('date');

            if (!$doctorId || !$date) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Doctor ID and date are required',
                ], 400);
            }

            // Use the same logic as BranchAdminAppointmentController
            $dayOfWeek = strtolower(Carbon::parse($date)->format('l'));

            $schedule = DoctorSchedule::where('doctor_id', $doctorId)
                ->where('schedule_day', $dayOfWeek)
                ->where('is_active', true)
                ->first();

            if (!$schedule) {
                return response()->json([
                    'status' => 200,
                    'slots' => [],
                    'message' => 'No schedule found for this doctor on selected day',
                ]);
            }

            // Get booked slots
            $bookedSlots = AppointmentBooking::where('doctor_id', $doctorId)
                ->whereDate('appointment_date', $date)
                ->whereNotIn('status', ['cancelled', 'rescheduled'])
                ->pluck('slot_number')
                ->toArray();

            $slots = [];
            $startTime = Carbon::parse($schedule->start_time);
            $timePerPatient = $schedule->time_per_patient ?? 15;

            for ($i = 1; $i <= $schedule->max_patients; $i++) {
                $slotTime = $startTime->copy()->addMinutes(($i - 1) * $timePerPatient);
                $isBooked = in_array($i, $bookedSlots);
                $slots[] = [
                    'slot_number' => $i,
                    'time' => $slotTime->format('h:i A'),
                    'is_booked' => $isBooked,
                    'is_available' => !$isBooked,
                ];
            }

            return response()->json([
                'status' => 200,
                'slots' => $slots,
                'schedule' => [
                    'start_time' => Carbon::parse($schedule->start_time)->format('h:i A'),
                    'end_time' => Carbon::parse($schedule->end_time)->format('h:i A'),
                    'max_patients' => $schedule->max_patients,
                    'booked_count' => count($bookedSlots),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Super Admin get available slots error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get available slots',
            ], 500);
        }
    }

    /**
     * Cancel an appointment (Super Admin override)
     */
    public function cancelAppointment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
                'is_doctor_request' => 'boolean',
            ]);

            $booking = AppointmentBooking::find($bookingId);
            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Appointment not found',
                ], 404);
            }

            if (in_array($booking->status, ['cancelled', 'completed'])) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Cannot cancel this appointment - already ' . $booking->status,
                ], 400);
            }

            $oldStatus = $booking->status;
            $isDoctorRequest = $validated['is_doctor_request'] ?? false;

            DB::transaction(function () use ($booking, $validated, $isDoctorRequest, $oldStatus) {
                $booking->status = 'cancelled';
                $booking->cancellation_reason = $validated['reason'];
                $booking->cancelled_at = now();
                $booking->cancelled_by = 'super_admin';
                $booking->is_doctor_cancelled = $isDoctorRequest;
                $booking->save();

                // Log the action (STEP 12 - Audit Logging)
                AppointmentLog::create([
                    'appointment_id' => $booking->id,
                    'branch_id' => $booking->branch_id,
                    'action' => 'cancelled',
                    'previous_status' => $oldStatus,
                    'new_status' => 'cancelled',
                    'performed_by' => auth()->id(),
                    'performed_by_role' => 'super_admin',
                    'reason' => $validated['reason'],
                    'metadata' => [
                        'is_doctor_request' => $isDoctorRequest,
                        'override_by' => 'super_admin',
                        'cancellation_type' => $isDoctorRequest ? 'doctor_request' : 'normal',
                    ],
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'created_at' => now(),
                ]);

                // If doctor cancelled, give patient 2 free reschedules
                if ($isDoctorRequest) {
                    // Store in patient's record for tracking
                    try {
                        if (Schema::hasTable('patient_reschedule_credits')) {
                            DB::table('patient_reschedule_credits')
                                ->insert([
                                    'patient_id' => $booking->patient_id,
                                    'booking_id' => $booking->id,
                                    'credits_remaining' => 2,
                                    'reason' => 'Doctor cancellation by Super Admin',
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to add reschedule credits: ' . $e->getMessage());
                    }
                }
            });

            // Send SMS notification
            try {
                $notificationService = app(\App\Application\Services\AppointmentNotificationService::class);
                $notificationService->sendAppointmentCancelledSMS($booking, $validated['reason'], 'super_admin');
            } catch (\Exception $e) {
                Log::warning('SMS notification failed: ' . $e->getMessage());
            }

            return response()->json([
                'status' => 200,
                'message' => 'Appointment cancelled successfully',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Super Admin cancel appointment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to cancel appointment',
            ], 500);
        }
    }

    /**
     * Reschedule an appointment (Super Admin override)
     */
    public function rescheduleAppointment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'new_date' => 'required|date|after_or_equal:today',
                'new_slot_number' => 'required|integer|min:1',
                'new_doctor_id' => 'nullable|string',
                'new_branch_id' => 'nullable|string',
                'reason' => 'required|string|max:500',
            ]);

            $booking = AppointmentBooking::find($bookingId);
            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Appointment not found',
                ], 404);
            }

            if (in_array($booking->status, ['cancelled', 'completed', 'rescheduled'])) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Cannot reschedule this appointment - already ' . $booking->status,
                ], 400);
            }

            $newDoctorId = $validated['new_doctor_id'] ?? $booking->doctor_id;
            $newBranchId = $validated['new_branch_id'] ?? $booking->branch_id;
            $newDate = $validated['new_date'];
            $newSlot = $validated['new_slot_number'];

            // Check if new slot is available
            $existingBooking = AppointmentBooking::where('doctor_id', $newDoctorId)
                ->whereDate('appointment_date', $newDate)
                ->where('slot_number', $newSlot)
                ->whereNotIn('status', ['cancelled', 'rescheduled'])
                ->where('id', '!=', $bookingId)
                ->first();

            if ($existingBooking) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Selected slot is already booked',
                ], 400);
            }

            // Get schedule for new time calculation
            $dayOfWeek = strtolower(Carbon::parse($newDate)->format('l'));
            $schedule = DoctorSchedule::where('doctor_id', $newDoctorId)
                ->where('schedule_day', $dayOfWeek)
                ->where('is_active', true)
                ->first();

            if (!$schedule) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Doctor has no schedule on selected day',
                ], 400);
            }

            $timePerPatient = $schedule->time_per_patient ?? 15;
            $newTime = Carbon::parse($schedule->start_time)
                ->addMinutes(($newSlot - 1) * $timePerPatient)
                ->format('H:i:s');

            $newBooking = null;
            DB::transaction(function () use ($booking, $validated, $newDoctorId, $newBranchId, $newDate, $newSlot, $newTime, &$newBooking) {
                // Mark old booking as rescheduled
                $oldData = $booking->toArray();
                $booking->status = 'rescheduled';
                $booking->save();

                // Create new booking
                $newBooking = AppointmentBooking::create([
                    'patient_id' => $booking->patient_id,
                    'doctor_id' => $newDoctorId,
                    'branch_id' => $newBranchId,
                    'appointment_date' => $newDate,
                    'appointment_time' => $newTime,
                    'slot_number' => $newSlot,
                    'token_number' => $this->generateTokenNumber($newDoctorId, $newDate),
                    'status' => 'confirmed',
                    'payment_status' => $booking->payment_status,
                    'payment_method' => $booking->payment_method,
                    'booking_fee' => $booking->booking_fee,
                    'amount_paid' => $booking->amount_paid,
                    'booking_type' => $booking->booking_type,
                    'appointment_type' => $booking->appointment_type,
                    'rescheduled_from' => $booking->id,
                    'notes' => $booking->notes,
                ]);

                // Log the action (STEP 12 - Audit Logging)
                AppointmentLog::create([
                    'appointment_id' => $booking->id,
                    'branch_id' => $booking->branch_id,
                    'action' => 'rescheduled',
                    'previous_status' => $oldData['status'],
                    'new_status' => 'rescheduled',
                    'performed_by' => auth()->id(),
                    'performed_by_role' => 'super_admin',
                    'reason' => $validated['reason'],
                    'metadata' => [
                        'old_date' => $oldData['appointment_date'],
                        'old_slot' => $oldData['slot_number'],
                        'old_doctor_id' => $oldData['doctor_id'],
                        'new_date' => $newDate,
                        'new_slot' => $newSlot,
                        'new_doctor_id' => $newDoctorId,
                        'new_branch_id' => $newBranchId,
                        'new_booking_id' => $newBooking->id,
                        'override_by' => 'super_admin',
                    ],
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'created_at' => now(),
                ]);
            });

            // Send SMS notification
            try {
                $notificationService = app(\App\Application\Services\AppointmentNotificationService::class);
                $notificationService->sendAppointmentRescheduledSMS($newBooking, $validated['reason'], 'super_admin');
            } catch (\Exception $e) {
                Log::warning('SMS notification failed: ' . $e->getMessage());
            }

            return response()->json([
                'status' => 200,
                'message' => 'Appointment rescheduled successfully',
                'old_booking_id' => $bookingId,
                'new_booking' => [
                    'id' => $newBooking->id,
                    'token_number' => $newBooking->token_number,
                    'appointment_date' => $newBooking->appointment_date,
                    'appointment_time' => Carbon::parse($newBooking->appointment_time)->format('h:i A'),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Super Admin reschedule appointment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to reschedule appointment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create appointment (Super Admin can create for any branch)
     */
    public function createAppointment(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'branch_id' => 'required|string|exists:branches,id',
                'patient_id' => 'required|string',
                'doctor_id' => 'required|string',
                'appointment_date' => 'required|date|after_or_equal:today',
                'slot_number' => 'required|integer|min:1',
                'booking_type' => 'required|in:walk_in,phone,online',
                'payment_status' => 'required|in:pending,paid,waived',
                'payment_method' => 'nullable|string',
                'amount_paid' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string|max:500',
            ]);

            // Check if slot is available
            $existingBooking = AppointmentBooking::where('doctor_id', $validated['doctor_id'])
                ->whereDate('appointment_date', $validated['appointment_date'])
                ->where('slot_number', $validated['slot_number'])
                ->whereNotIn('status', ['cancelled', 'rescheduled'])
                ->first();

            if ($existingBooking) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Selected slot is already booked',
                ], 400);
            }

            // Get schedule for time calculation
            $dayOfWeek = strtolower(Carbon::parse($validated['appointment_date'])->format('l'));
            $schedule = DoctorSchedule::where('doctor_id', $validated['doctor_id'])
                ->where('schedule_day', $dayOfWeek)
                ->where('is_active', true)
                ->first();

            if (!$schedule) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Doctor has no schedule on selected day',
                ], 400);
            }

            $timePerPatient = $schedule->time_per_patient ?? 15;
            $appointmentTime = Carbon::parse($schedule->start_time)
                ->addMinutes(($validated['slot_number'] - 1) * $timePerPatient)
                ->format('H:i:s');

            // Get booking fee
            $settings = AppointmentSettings::where('branch_id', $validated['branch_id'])->first();
            $bookingFee = $settings->default_booking_fee ?? 500;

            $booking = AppointmentBooking::create([
                'patient_id' => $validated['patient_id'],
                'doctor_id' => $validated['doctor_id'],
                'branch_id' => $validated['branch_id'],
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $appointmentTime,
                'slot_number' => $validated['slot_number'],
                'token_number' => $this->generateTokenNumber($validated['doctor_id'], $validated['appointment_date']),
                'status' => 'confirmed',
                'payment_status' => $validated['payment_status'],
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'booking_fee' => $bookingFee,
                'amount_paid' => $validated['amount_paid'] ?? 0,
                'booking_type' => $validated['booking_type'],
                'appointment_type' => 'new',
                'notes' => $validated['notes'],
            ]);

            // Log the action (STEP 12 - Audit Logging)
            AppointmentLog::create([
                'appointment_id' => $booking->id,
                'branch_id' => $validated['branch_id'],
                'action' => 'created',
                'new_status' => 'confirmed',
                'performed_by' => auth()->id(),
                'performed_by_role' => 'super_admin',
                'metadata' => [
                    'booking_type' => $validated['booking_type'],
                    'doctor_id' => $validated['doctor_id'],
                    'patient_id' => $validated['patient_id'],
                    'appointment_date' => $validated['appointment_date'],
                    'slot_number' => $validated['slot_number'],
                    'override_by' => 'super_admin',
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            // Send SMS notification
            try {
                $notificationService = app(\App\Application\Services\AppointmentNotificationService::class);
                $notificationService->sendAppointmentConfirmationSMS($booking);
            } catch (\Exception $e) {
                Log::warning('SMS notification failed: ' . $e->getMessage());
            }

            return response()->json([
                'status' => 200,
                'message' => 'Appointment created successfully',
                'appointment' => [
                    'id' => $booking->id,
                    'token_number' => $booking->token_number,
                    'appointment_date' => $booking->appointment_date,
                    'appointment_time' => Carbon::parse($booking->appointment_time)->format('h:i A'),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Super Admin create appointment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create appointment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create appointment with new patient registration
     */
    public function createAppointmentWithPatient(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'branch_id' => 'required|string|exists:branches,id',
                'patient_id' => 'nullable|string',
                'new_patient' => 'nullable|array',
                'new_patient.full_name' => 'required_without:patient_id|string|max:255',
                'new_patient.mobile_number' => 'required_without:patient_id|string',
                'new_patient.nic' => 'nullable|string',
                'new_patient.gender' => 'required_without:patient_id|in:male,female,other',
                'new_patient.date_of_birth' => 'nullable|date',
                'new_patient.address' => 'nullable|string',
                'new_patient.send_sms' => 'boolean',
                'doctor_id' => 'required|string',
                'appointment_date' => 'required|date|after_or_equal:today',
                'slot_number' => 'required|integer|min:1',
                'booking_type' => 'required|in:walk_in,phone,online',
                'payment_status' => 'required|in:pending,paid,waived',
                'payment_method' => 'nullable|string',
                'amount_paid' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string|max:500',
            ]);

            // Use BranchAdminAppointmentController logic by delegating
            // First set the branch context
            $request->merge(['branch_id' => $validated['branch_id']]);

            // If new patient, register them first
            $patientId = $validated['patient_id'] ?? null;
            $patientCredentials = null;
            $isNewPatient = false;

            if (!$patientId && isset($validated['new_patient'])) {
                // Register new patient (reuse logic from BranchAdminAppointmentController)
                $patientData = $validated['new_patient'];
                
                // Check for existing patient with same phone
                $existingPatient = DB::table('patients')
                    ->where('phone_number', $patientData['mobile_number'])
                    ->first();

                if ($existingPatient) {
                    $patientId = $existingPatient->user_id ?? $existingPatient->id;
                } else {
                    // Generate credentials
                    $username = 'P' . strtoupper(substr(md5(uniqid()), 0, 6));
                    $tempPassword = strtoupper(substr(md5(uniqid()), 0, 8));
                    
                    // Create user
                    $userId = DB::table('users')->insertGetId([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'first_name' => explode(' ', $patientData['full_name'])[0] ?? $patientData['full_name'],
                        'last_name' => count(explode(' ', $patientData['full_name'])) > 1 ? explode(' ', $patientData['full_name'], 2)[1] : '',
                        'email' => $username . '@patient.local',
                        'username' => $username,
                        'phone' => $patientData['mobile_number'],
                        'password' => bcrypt($tempPassword),
                        'role_as' => 7, // Patient role
                        'is_active' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Get the UUID
                    $user = DB::table('users')->find($userId);
                    $patientId = $user->id;

                    // Create patient record
                    DB::table('patients')->insert([
                        'user_id' => $patientId,
                        'first_name' => explode(' ', $patientData['full_name'])[0] ?? $patientData['full_name'],
                        'last_name' => count(explode(' ', $patientData['full_name'])) > 1 ? explode(' ', $patientData['full_name'], 2)[1] : '',
                        'phone_number' => $patientData['mobile_number'],
                        'nic_number' => $patientData['nic'] ?? null,
                        'gender' => $patientData['gender'],
                        'dob' => $patientData['date_of_birth'] ?? null,
                        'address' => $patientData['address'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $isNewPatient = true;
                    $patientCredentials = [
                        'username' => $username,
                        'password' => $tempPassword,
                        'login_url' => url('/login'),
                    ];

                    // Send SMS with credentials if requested
                    if ($patientData['send_sms'] ?? true) {
                        try {
                            $smsService = app(\App\Application\Services\SmsService::class);
                            $smsService->sendPatientCredentials(
                                $patientData['mobile_number'],
                                $patientData['full_name'],
                                $username,
                                $tempPassword
                            );
                        } catch (\Exception $e) {
                            Log::warning('SMS credentials failed: ' . $e->getMessage());
                        }
                    }
                }
            }

            if (!$patientId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Patient ID is required or provide new patient details',
                ], 400);
            }

            // Now create the appointment
            $request->merge(['patient_id' => $patientId]);
            $createResult = $this->createAppointment($request);
            $responseData = json_decode($createResult->getContent(), true);

            if ($responseData['status'] !== 200) {
                return $createResult;
            }

            // Add patient info to response
            $responseData['is_new_patient'] = $isNewPatient;
            if ($patientCredentials) {
                $responseData['patient_credentials'] = $patientCredentials;
            }

            return response()->json($responseData);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Super Admin create appointment with patient error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create appointment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search patients across all branches
     */
    public function searchPatients(Request $request): JsonResponse
    {
        try {
            $query = $request->query('query', '');
            $branchId = $request->query('branch_id');

            if (strlen($query) < 2) {
                return response()->json([
                    'status' => 200,
                    'patients' => [],
                ]);
            }

            $patients = DB::table('patients')
                ->leftJoin('users', 'patients.user_id', '=', 'users.id')
                ->where(function ($q) use ($query) {
                    $q->where('patients.first_name', 'LIKE', "%{$query}%")
                      ->orWhere('patients.last_name', 'LIKE', "%{$query}%")
                      ->orWhere('patients.phone_number', 'LIKE', "%{$query}%")
                      ->orWhere('patients.nic_number', 'LIKE', "%{$query}%")
                      ->orWhere(DB::raw("patients.first_name || ' ' || patients.last_name"), 'LIKE', "%{$query}%");
                })
                ->select([
                    'patients.id',
                    'patients.user_id',
                    'patients.first_name',
                    'patients.last_name',
                    'patients.phone_number',
                    'patients.nic_number',
                    'patients.gender',
                    'patients.dob',
                ])
                ->limit(20)
                ->get()
                ->map(function ($p) {
                    return [
                        'id' => $p->user_id ?? $p->id,
                        'patient_id' => $p->id,
                        'name' => trim($p->first_name . ' ' . $p->last_name),
                        'phone' => $p->phone_number,
                        'nic' => $p->nic_number,
                        'gender' => $p->gender,
                        'dob' => $p->dob,
                    ];
                });

            return response()->json([
                'status' => 200,
                'patients' => $patients,
            ]);
        } catch (\Exception $e) {
            Log::error('Super Admin search patients error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to search patients',
            ], 500);
        }
    }

    /**
     * Update appointment status
     */
    public function updateStatus(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,confirmed,checked_in,in_session,completed,cancelled,no_show',
                'reason' => 'required|string|max:500',
            ]);

            $booking = AppointmentBooking::find($bookingId);
            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Appointment not found',
                ], 404);
            }

            $oldStatus = $booking->status;
            $booking->status = $validated['status'];
            $booking->save();

            // Log the action (STEP 12 - Audit Logging)
            AppointmentLog::create([
                'appointment_id' => $booking->id,
                'branch_id' => $booking->branch_id,
                'action' => 'status_changed',
                'previous_status' => $oldStatus,
                'new_status' => $validated['status'],
                'performed_by' => auth()->id(),
                'performed_by_role' => 'super_admin',
                'reason' => $validated['reason'],
                'metadata' => [
                    'override_by' => 'super_admin',
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Status updated successfully',
                'new_status' => $validated['status'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Super Admin update status error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update status',
            ], 500);
        }
    }

    /**
     * Generate unique token number for a doctor on a date
     */
    private function generateTokenNumber(string $doctorId, string $date): int
    {
        $maxToken = AppointmentBooking::where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $date)
            ->max('token_number');

        return ($maxToken ?? 0) + 1;
    }
}
