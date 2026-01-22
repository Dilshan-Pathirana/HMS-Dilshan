<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Models\Appointment\AppointmentBooking;
use App\Models\Appointment\AppointmentSettings;
use App\Models\Appointment\AppointmentLog;
use App\Models\SystemSettings;
use App\Services\AppointmentSmsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AppointmentBookingController extends Controller
{
    /**
     * Get list of all Sri Lanka cities for appointment booking
     */
    public function getCities(): JsonResponse
    {
        try {
            // Complete list of Sri Lanka cities (same as used in SignupForm and PatientRegistration)
            $cities = collect([
                'Colombo', 'Dehiwala-Mount Lavinia', 'Moratuwa', 'Sri Jayawardenepura Kotte', 'Negombo',
                'Kandy', 'Kalmunai', 'Vavuniya', 'Galle', 'Trincomalee', 'Batticaloa', 'Jaffna',
                'Katunayake', 'Dambulla', 'Kolonnawa', 'Anuradhapura', 'Ratnapura', 'Badulla',
                'Matara', 'Puttalam', 'Chavakachcheri', 'Kattankudy', 'Hambantota', 'Samanthurai',
                'Bentota', 'Gampaha', 'Kurunegala', 'Matale', 'Kalutara', 'Nuwara Eliya',
                'Polonnaruwa', 'Ampara', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Chilaw',
                'Panadura', 'Horana', 'Kaduwela', 'Kelaniya', 'Maharagama', 'Kottawa',
                'Nugegoda', 'Piliyandala', 'Ragama', 'Wattala', 'Ja-Ela', 'Kandana',
                'Battaramulla', 'Boralesgamuwa', 'Wellampitiya', 'Avissawella', 'Homagama',
                'Kesbewa', 'Beruwala', 'Aluthgama', 'Ambalangoda', 'Hikkaduwa', 'Unawatuna',
                'Weligama', 'Mirissa', 'Tangalle', 'Tissamaharama', 'Ella', 'Haputale',
                'Bandarawela', 'Welimada', 'Mahiyanganaya', 'Passara', 'Monaragala',
                'Embilipitiya', 'Balangoda', 'Pelmadulla', 'Eheliyagoda', 'Kegalle',
                'Mawanella', 'Rambukkana', 'Warakapola', 'Gampola', 'Nawalapitiya',
                'Hatton', 'Nanu Oya', 'Talawakele', 'Maskeliya', 'Harispattuwa',
                'Kundasale', 'Peradeniya', 'Digana', 'Akurana', 'Kadugannawa',
                'Narammala', 'Kuliyapitiya', 'Pannala', 'Nittambuwa', 'Minuwangoda',
                'Divulapitiya', 'Veyangoda', 'Giriulla', 'Alawwa', 'Polgahawela',
                'Hettipola', 'Ibbagamuwa', 'Ridigama', 'Nikaweratiya', 'Maho',
                'Medawachchiya', 'Mihintale', 'Kekirawa', 'Habarana', 'Sigiriya',
                'Galenbindunuwewa', 'Talawa', 'Thirappane', 'Padaviya', 'Kebithigollewa',
                'Point Pedro', 'Nallur', 'Chunnakam', 'Kopay', 'Manipay', 'Kayts',
                'Karainagar', 'Velanai', 'Valvettithurai', 'Kodikamam', 'Tellippalai',
                'Elephant Pass', 'Pooneryn', 'Nedunkerny', 'Oddusuddan', 'Puthukkudiyiruppu',
                'Akkaraipattu', 'Pottuvil', 'Uhana', 'Padiyathalawa', 'Dehiattakandiya',
                'Eravur', 'Valaichchenai', 'Kinniya', 'Muttur', 'Kantale', 'Seruvila'
            ])->sort()->values();

            return response()->json([
                'status' => 200,
                'cities' => $cities,
            ]);
        } catch (\Exception $e) {
            Log::error('Get cities error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get cities',
            ], 500);
        }
    }

    /**
     * Search doctors with filters
     */
    public function searchDoctors(Request $request): JsonResponse
    {
        try {
            $branchId = $request->input('branch_id');
            $city = $request->input('city');
            $specialization = $request->input('specialization');
            $date = $request->input('date');
            $doctorName = $request->input('doctor_name');

            $query = DB::table('doctor_schedules')
                ->join('users', 'doctor_schedules.doctor_id', '=', 'users.id')
                ->join('branches', 'doctor_schedules.branch_id', '=', 'branches.id')
                ->leftJoin('doctors', 'users.id', '=', 'doctors.user_id')
                ->where('doctor_schedules.status', 'active')
                ->where('doctor_schedules.is_available', true)
                ->where('users.is_active', true) // Active doctors only
                ->select([
                    'users.id as doctor_id',
                    'users.first_name',
                    'users.last_name',
                    'users.profile_picture',
                    'doctors.areas_of_specialization as specialization',
                    'doctors.qualifications',
                    'branches.id as branch_id',
                    'branches.center_name as branch_name',
                    'branches.city as branch_city',
                    'doctor_schedules.id as schedule_id',
                    'doctor_schedules.schedule_day',
                    'doctor_schedules.start_time',
                    'doctor_schedules.end_time',
                    'doctor_schedules.max_patients',
                    'doctor_schedules.time_per_patient',
                ]);

            // Apply filters
            if ($branchId) {
                $query->where('doctor_schedules.branch_id', $branchId);
            }

            if ($city) {
                // Search in both city column and center_name for compatibility
                $query->where(function ($q) use ($city) {
                    $q->where('branches.city', 'like', "%{$city}%")
                      ->orWhere('branches.center_name', 'like', "%{$city}%");
                });
            }

            if ($specialization) {
                $query->where('doctors.areas_of_specialization', 'like', "%{$specialization}%");
            }

            if ($doctorName) {
                $query->where(function ($q) use ($doctorName) {
                    $q->where('users.first_name', 'like', "%{$doctorName}%")
                      ->orWhere('users.last_name', 'like', "%{$doctorName}%");
                });
            }

            // If date is provided, filter by schedule day
            if ($date) {
                $dayOfWeek = Carbon::parse($date)->format('l'); // Monday, Tuesday, etc.
                $query->where('doctor_schedules.schedule_day', $dayOfWeek);
            }

            $schedules = $query->get();

            // Group by doctor
            $doctors = $schedules->groupBy('doctor_id')->map(function ($doctorSchedules) {
                $first = $doctorSchedules->first();
                return [
                    'doctor_id' => $first->doctor_id,
                    'first_name' => $first->first_name,
                    'last_name' => $first->last_name,
                    'full_name' => trim($first->first_name . ' ' . $first->last_name),
                    'profile_picture' => $first->profile_picture,
                    'specialization' => $first->specialization,
                    'qualification' => $first->qualifications,
                    'schedules' => $doctorSchedules->map(function ($s) {
                        return [
                            'schedule_id' => $s->schedule_id,
                            'branch_id' => $s->branch_id,
                            'branch_name' => $s->branch_name,
                            'branch_city' => $s->branch_city,
                            'schedule_day' => $s->schedule_day,
                            'start_time' => $s->start_time,
                            'end_time' => $s->end_time,
                            'max_patients' => $s->max_patients,
                            'time_per_patient' => $s->time_per_patient,
                        ];
                    })->values(),
                ];
            })->values();

            return response()->json([
                'status' => 200,
                'doctors' => $doctors,
                'total' => $doctors->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Doctor search error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to search doctors',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get schedules for a specific doctor (all branches)
     * Used for reschedule feature to show branch options
     */
    public function getDoctorSchedules(string $doctorId): JsonResponse
    {
        try {
            $schedules = DB::table('doctor_schedules')
                ->join('branches', 'doctor_schedules.branch_id', '=', 'branches.id')
                ->where('doctor_schedules.doctor_id', $doctorId)
                ->where('doctor_schedules.status', 'active')
                ->where('doctor_schedules.is_available', true)
                ->select([
                    'doctor_schedules.id as schedule_id',
                    'doctor_schedules.branch_id',
                    'branches.center_name as branch_name',
                    'branches.city as branch_city',
                    'doctor_schedules.schedule_day',
                    'doctor_schedules.start_time',
                    'doctor_schedules.end_time',
                    'doctor_schedules.max_patients',
                    'doctor_schedules.time_per_patient',
                ])
                ->get();

            return response()->json([
                'status' => 200,
                'schedules' => $schedules,
                'total' => $schedules->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Get doctor schedules error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get doctor schedules',
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
                'branch_id' => 'required|string',
                'date' => 'required|date',
                'schedule_id' => 'nullable|string',
            ]);

            $doctorId = $validated['doctor_id'];
            $branchId = $validated['branch_id'];
            $date = $validated['date'];
            $dayOfWeek = Carbon::parse($date)->format('l');

            // Get doctor's schedule for this day
            $scheduleQuery = DB::table('doctor_schedules')
                ->where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->where('schedule_day', $dayOfWeek)
                ->where('status', 'active')
                ->where('is_available', true);

            if (!empty($validated['schedule_id'])) {
                $scheduleQuery->where('id', $validated['schedule_id']);
            }

            $schedule = $scheduleQuery->first();

            if (!$schedule) {
                return response()->json([
                    'status' => 404,
                    'message' => 'No schedule found for this doctor on the selected day',
                ], 404);
            }

            // Check for schedule cancellations/modifications
            $cancellation = DB::table('doctor_schedule_cancellations')
                ->where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->whereDate('date', $date)
                ->where('status', 1)
                ->first();

            if ($cancellation) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Doctor schedule is cancelled for this date',
                ], 400);
            }

            // Check blocked dates from modification requests
            $blockedDate = DB::table('schedule_modification_requests')
                ->where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->whereIn('request_type', ['block_date', 'block_schedule'])
                ->where('status', 'approved')
                ->where('start_date', '<=', $date)
                ->where(function ($q) use ($date) {
                    $q->where('end_date', '>=', $date)
                      ->orWhereNull('end_date');
                })
                ->first();

            if ($blockedDate) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Doctor is not available on this date',
                ], 400);
            }

            // Get appointment settings for advance booking validation
            $settings = AppointmentSettings::getForBranch($branchId);
            
            if (!$settings->isDateWithinBookingLimit($date)) {
                return response()->json([
                    'status' => 400,
                    'message' => "Appointments can only be booked up to {$settings->max_advance_booking_days} days in advance",
                ], 400);
            }

            // Generate all slots
            $maxPatients = $schedule->max_patients;
            $allSlots = range(1, $maxPatients);

            // Get booked slots
            $bookedSlots = AppointmentBooking::where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->whereDate('appointment_date', $date)
                ->whereNotIn('status', [
                    AppointmentBooking::STATUS_CANCELLED,
                    AppointmentBooking::STATUS_RESCHEDULED
                ])
                ->pluck('slot_number')
                ->toArray();

            // Calculate available slots
            $availableSlots = array_values(array_diff($allSlots, $bookedSlots));
            $remainingSlots = count($availableSlots);

            // Determine session status
            $sessionStatus = 'Open';
            if ($remainingSlots === 0) {
                $sessionStatus = 'Full';
            } elseif ($remainingSlots <= 3) {
                $sessionStatus = 'Nearly Full';
            }

            return response()->json([
                'status' => 200,
                'data' => [
                    'schedule_id' => $schedule->id,
                    'doctor_id' => $doctorId,
                    'branch_id' => $branchId,
                    'date' => $date,
                    'day' => $dayOfWeek,
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'max_patients' => $maxPatients,
                    'time_per_patient' => $schedule->time_per_patient,
                    'all_slots' => $allSlots,
                    'booked_slots' => $bookedSlots,
                    'available_slots' => $availableSlots,
                    'remaining_slots' => $remainingSlots,
                    'session_status' => $sessionStatus,
                    'booking_fee' => $settings->default_booking_fee,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get available slots error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get available slots',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get slots with time estimates for appointment wizard Step 3
     */
    public function getSlotsWithTimeEstimates(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'doctor_id' => 'required|string',
                'branch_id' => 'required|string',
                'date' => 'required|date',
            ]);

            $doctorId = $validated['doctor_id'];
            $branchId = $validated['branch_id'];
            $date = $validated['date'];
            $dayOfWeek = Carbon::parse($date)->format('l');

            // Get schedule
            $schedule = DB::table('doctor_schedules')
                ->where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->where('schedule_day', $dayOfWeek)
                ->where('status', 'active')
                ->where('is_available', true)
                ->first();

            if (!$schedule) {
                return response()->json([
                    'status' => 404,
                    'message' => 'No schedule found for this doctor on the selected day',
                ], 404);
            }

            // Get booked slots
            $bookedSlots = AppointmentBooking::where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->whereDate('appointment_date', $date)
                ->whereNotIn('status', [
                    AppointmentBooking::STATUS_CANCELLED,
                    AppointmentBooking::STATUS_RESCHEDULED
                ])
                ->pluck('slot_number')
                ->toArray();

            // Generate slots with time estimates
            $startTime = Carbon::parse($schedule->start_time);
            $timePerPatient = $schedule->time_per_patient ?? 15;
            $maxPatients = $schedule->max_patients;

            $slots = [];
            for ($i = 1; $i <= $maxPatients; $i++) {
                $estimatedTime = $startTime->copy()->addMinutes(($i - 1) * $timePerPatient);
                $estimatedEndTime = $estimatedTime->copy()->addMinutes($timePerPatient);
                
                $slots[] = [
                    'slot_number' => $i,
                    'estimated_time' => $estimatedTime->format('h:i A'),
                    'estimated_end_time' => $estimatedEndTime->format('h:i A'),
                    'is_available' => !in_array($i, $bookedSlots),
                    'is_booked' => in_array($i, $bookedSlots),
                ];
            }

            // Get branch and doctor info
            $doctor = DB::table('users')
                ->leftJoin('doctors', 'users.id', '=', 'doctors.user_id')
                ->where('users.id', $doctorId)
                ->select(['users.first_name', 'users.last_name', 'doctors.areas_of_specialization'])
                ->first();

            $branch = DB::table('branches')
                ->where('id', $branchId)
                ->select(['center_name', 'city', 'address'])
                ->first();

            // Get global booking fee from system settings (controlled by Super Admin)
            $bookingFeePerSlot = SystemSettings::getBookingFeePerSlot();

            return response()->json([
                'status' => 200,
                'data' => [
                    'doctor' => [
                        'id' => $doctorId,
                        'name' => trim(($doctor->first_name ?? '') . ' ' . ($doctor->last_name ?? '')),
                        'specialization' => $doctor->areas_of_specialization ?? null,
                    ],
                    'branch' => [
                        'id' => $branchId,
                        'name' => $branch->center_name ?? '',
                        'city' => $branch->city ?? '',
                        'address' => $branch->address ?? '',
                    ],
                    'date' => $date,
                    'day' => $dayOfWeek,
                    'session' => [
                        'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time,
                        'time_per_patient' => $timePerPatient,
                    ],
                    'slots' => $slots,
                    'summary' => [
                        'total_slots' => $maxPatients,
                        'available' => $maxPatients - count($bookedSlots),
                        'booked' => count($bookedSlots),
                    ],
                    'booking_fee_per_slot' => $bookingFeePerSlot,
                    'disclaimer' => 'Estimated times are approximate and may vary based on actual consultation duration.',
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get slots with time estimates error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get slot times',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check for duplicate appointments
     */
    public function checkDuplicateAppointment(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|string',
                'doctor_id' => 'required|string',
                'appointment_date' => 'required|date',
            ]);

            // Check if patient already has an appointment with this doctor on this date
            $existingAppointment = AppointmentBooking::where('patient_id', $validated['patient_id'])
                ->where('doctor_id', $validated['doctor_id'])
                ->where('appointment_date', $validated['appointment_date'])
                ->whereNotIn('status', ['cancelled', 'no_show', 'rejected'])
                ->first();

            return response()->json([
                'status' => 200,
                'has_duplicate' => $existingAppointment !== null,
                'message' => $existingAppointment !== null 
                    ? 'You already have an appointment with this doctor on this date.' 
                    : 'No duplicate appointment found.',
            ]);
        } catch (\Exception $e) {
            Log::error('Check duplicate appointment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to check for duplicate appointments',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create appointment booking (Patient online booking)
     * Supports both single slot (slot_number) and multi-slot (slot_numbers array)
     */
    public function createBooking(Request $request): JsonResponse
    {
        try {
            // Log incoming request for debugging
            Log::info('CreateBooking request received', [
                'all_input' => $request->all(),
                'has_slot_numbers' => $request->has('slot_numbers'),
                'slot_numbers_value' => $request->slot_numbers,
            ]);
            
            // Support both single slot_number and array slot_numbers
            $hasMultipleSlots = $request->has('slot_numbers') && is_array($request->slot_numbers);
            
            $validated = $request->validate([
                'patient_id' => 'required|string',
                'doctor_id' => 'required|string',
                'branch_id' => 'required|string',
                'schedule_id' => 'nullable|string',
                'appointment_date' => 'required|date|after_or_equal:today',
                'slot_number' => $hasMultipleSlots ? 'nullable|integer|min:1' : 'required|integer|min:1',
                'slot_numbers' => 'nullable|array|min:1|max:5',
                'slot_numbers.*' => 'integer|min:1',
                'appointment_type' => 'nullable|string|in:consultation,follow_up,emergency,routine_checkup',
                'notes' => 'nullable|string|max:1000',
                'total_amount' => 'nullable|numeric|min:0',
            ]);

            $user = $request->user();
            $patientId = $validated['patient_id'];
            $doctorId = $validated['doctor_id'];
            $branchId = $validated['branch_id'];
            $date = $validated['appointment_date'];
            
            // Get slot numbers - either from array or single value
            $slotNumbers = $hasMultipleSlots 
                ? $validated['slot_numbers'] 
                : [$validated['slot_number']];
            
            // Sort slot numbers
            sort($slotNumbers);

            // Get settings
            $settings = AppointmentSettings::getForBranch($branchId);

            // Validate advance booking limit
            if (!$settings->isDateWithinBookingLimit($date)) {
                Log::info('Booking rejected: advance booking limit exceeded', [
                    'date' => $date,
                    'max_days' => $settings->max_advance_booking_days,
                ]);
                return response()->json([
                    'status' => 400,
                    'message' => "Appointments can only be booked up to {$settings->max_advance_booking_days} days in advance",
                ], 400);
            }

            // Check maximum appointments per day (limit: 5)
            $existingAppointments = AppointmentBooking::where('patient_id', $patientId)
                ->where('doctor_id', $doctorId)
                ->whereDate('appointment_date', $date)
                ->whereNotIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_RESCHEDULED, AppointmentBooking::STATUS_EXPIRED])
                ->count();
            
            $maxAppointmentsPerDay = 5;
            $newAppointmentsCount = count($slotNumbers);
            
            if (($existingAppointments + $newAppointmentsCount) > $maxAppointmentsPerDay) {
                Log::info('Booking rejected: max appointments per day exceeded', [
                    'patient_id' => $patientId,
                    'doctor_id' => $doctorId,
                    'date' => $date,
                    'existing' => $existingAppointments,
                    'requested' => $newAppointmentsCount,
                    'max' => $maxAppointmentsPerDay,
                ]);
                return response()->json([
                    'status' => 400,
                    'message' => "You can book a maximum of {$maxAppointmentsPerDay} appointments per day with this doctor. You already have {$existingAppointments} appointment(s).",
                ], 400);
            }

            // Clean up stale pending_payment bookings before checking availability
            AppointmentBooking::cleanupStalePendingBookings(30);
            
            // Also delete cancelled/expired bookings that are blocking slots
            DB::table('appointment_bookings')
                ->where('doctor_id', $doctorId)
                ->whereDate('appointment_date', $date)
                ->whereIn('status', [AppointmentBooking::STATUS_CANCELLED, AppointmentBooking::STATUS_EXPIRED])
                ->delete();

            // Check slot availability for all slots
            $unavailableSlots = [];
            foreach ($slotNumbers as $slotNum) {
                if (!AppointmentBooking::isSlotAvailable($doctorId, $date, $slotNum)) {
                    $unavailableSlots[] = $slotNum;
                }
            }
            
            if (!empty($unavailableSlots)) {
                Log::info('Booking rejected: slots unavailable', [
                    'unavailable_slots' => $unavailableSlots,
                    'doctor_id' => $doctorId,
                    'date' => $date,
                ]);
                return response()->json([
                    'status' => 400,
                    'message' => 'Some slots are no longer available: #' . implode(', #', $unavailableSlots) . '. Please select different slots.',
                    'unavailable_slots' => $unavailableSlots,
                ], 400);
            }

            // Get schedule for appointment time
            $dayOfWeek = Carbon::parse($date)->format('l');
            $schedule = DB::table('doctor_schedules')
                ->where('doctor_id', $doctorId)
                ->where('branch_id', $branchId)
                ->where('schedule_day', $dayOfWeek)
                ->first();

            if (!$schedule) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Invalid schedule',
                ], 400);
            }

            // Create bookings
            DB::beginTransaction();

            $requirePayment = $settings->require_payment_for_online;
            // Get global booking fee from system settings (controlled by Super Admin)
            $bookingFeePerSlot = SystemSettings::getBookingFeePerSlot();
            $totalAmount = count($slotNumbers) * $bookingFeePerSlot;
            $timePerPatient = $schedule->time_per_patient ?? 15;
            
            $bookings = [];
            $firstBooking = null;
            
            foreach ($slotNumbers as $slotNumber) {
                // Calculate appointment time based on slot
                $startTime = Carbon::parse($schedule->start_time);
                $appointmentTime = $startTime->addMinutes(($slotNumber - 1) * $timePerPatient);
                
                $tokenNumber = AppointmentBooking::getNextTokenNumber($doctorId, $branchId, $date);

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
                    'booking_type' => AppointmentBooking::BOOKING_ONLINE,
                    'status' => $requirePayment 
                        ? AppointmentBooking::STATUS_PENDING_PAYMENT 
                        : AppointmentBooking::STATUS_CONFIRMED,
                    'payment_status' => $requirePayment 
                        ? AppointmentBooking::PAYMENT_PENDING 
                        : AppointmentBooking::PAYMENT_WAIVED,
                    'booking_fee' => $bookingFeePerSlot,
                    'booked_by' => $user->id,
                    'booked_by_role' => 'patient',
                    'notes' => $validated['notes'] ?? null,
                ]);

                // Log the action
                AppointmentLog::log(
                    $booking->id,
                    AppointmentLog::ACTION_CREATED,
                    $user->id,
                    AppointmentLog::ROLE_PATIENT,
                    null,
                    $booking->status,
                    null,
                    [
                        'slot_number' => $slotNumber,
                        'token_number' => $tokenNumber,
                        'booking_fee' => $bookingFeePerSlot,
                        'multi_slot_booking' => count($slotNumbers) > 1,
                    ]
                );
                
                $bookings[] = [
                    'id' => $booking->id,
                    'token_number' => $tokenNumber,
                    'slot_number' => $slotNumber,
                    'appointment_time' => $appointmentTime->format('h:i A'),
                ];
                
                if (!$firstBooking) {
                    $firstBooking = $booking;
                }
            }

            DB::commit();

            // Build response
            $responseBooking = [
                'id' => $firstBooking->id,
                'token_number' => $bookings[0]['token_number'],
                'appointment_date' => $date,
                'appointment_time' => $bookings[0]['appointment_time'],
                'slot_number' => $bookings[0]['slot_number'],
                'status' => $firstBooking->status,
                'payment_required' => $requirePayment,
                'booking_fee' => $bookingFeePerSlot,
                'total_amount' => $totalAmount,
            ];
            
            // Include all bookings if multiple slots
            if (count($bookings) > 1) {
                $responseBooking['bookings'] = $bookings;
            }

            return response()->json([
                'status' => 201,
                'message' => $requirePayment 
                    ? 'Booking created. Please complete payment to confirm.' 
                    : (count($slotNumbers) > 1 
                        ? count($slotNumbers) . ' appointments booked successfully!' 
                        : 'Appointment booked successfully!'),
                'booking' => $responseBooking,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            Log::error('Create booking query error: ' . $e->getMessage());
            
            // Check for UNIQUE constraint violation (slot already booked)
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed') && str_contains($e->getMessage(), 'slot_number')) {
                return response()->json([
                    'status' => 400,
                    'message' => 'The selected slot(s) are no longer available. Another patient may have just booked them. Please refresh and select different slots.',
                    'slot_conflict' => true,
                    'unavailable_slots' => $slotNumbers ?? [],
                ], 400);
            }
            
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create booking due to a database error',
                'error' => config('app.debug') ? $e->getMessage() : 'Database error',
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create booking error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create booking',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Prepare PayHere payment data for a booking
     */
    public function preparePayHerePayment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            // Get patient data
            $patient = DB::table('patients')
                ->leftJoin('users', 'patients.user_id', '=', 'users.id')
                ->where('patients.user_id', $booking->patient_id)
                ->select([
                    'patients.first_name',
                    'patients.last_name',
                    'patients.phone',
                    'users.email',
                    'patients.address',
                ])
                ->first();

            if (!$patient) {
                // Fallback to user table
                $user = $request->user();
                $patient = (object) [
                    'first_name' => $user->first_name ?? 'Patient',
                    'last_name' => $user->last_name ?? '',
                    'email' => $user->email ?? 'patient@hospital.com',
                    'phone' => $user->phone ?? '0000000000',
                    'address' => $user->address ?? '',
                ];
            }

            // Use PayHere service to generate payment data
            $payHereService = app(\App\Services\PayHereService::class);
            $paymentData = $payHereService->generatePaymentData($booking, [
                'first_name' => $patient->first_name ?? 'Patient',
                'last_name' => $patient->last_name ?? '',
                'email' => $patient->email ?? 'patient@hospital.com',
                'phone' => $patient->phone ?? '0000000000',
                'address' => $patient->address ?? '',
            ]);

            return response()->json([
                'status' => 200,
                'booking_id' => $bookingId,
                'payment_data' => $paymentData,
            ]);
        } catch (\Exception $e) {
            Log::error('Prepare PayHere payment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to prepare payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Confirm payment and finalize booking
     */
    public function confirmPayment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_id' => 'required|string',
                'payment_method' => 'required|string|in:paypal,payhere,card,cash,manual',
                'amount_paid' => 'required|numeric|min:0',
            ]);

            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            if ($booking->status !== AppointmentBooking::STATUS_PENDING_PAYMENT) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This booking is not pending payment',
                ], 400);
            }

            $user = $request->user();
            $previousStatus = $booking->status;

            DB::beginTransaction();

            $booking->update([
                'status' => AppointmentBooking::STATUS_CONFIRMED,
                'payment_status' => AppointmentBooking::PAYMENT_PAID,
                'payment_method' => $validated['payment_method'],
                'payment_id' => $validated['payment_id'],
                'amount_paid' => $validated['amount_paid'],
                'payment_date' => now(),
            ]);

            // Log the payment
            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_PAYMENT_RECEIVED,
                $user->id,
                $this->getUserRole($user),
                $previousStatus,
                $booking->status,
                null,
                [
                    'payment_id' => $validated['payment_id'],
                    'payment_method' => $validated['payment_method'],
                    'amount_paid' => $validated['amount_paid'],
                ]
            );

            // Log confirmation
            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_CONFIRMED,
                $user->id,
                $this->getUserRole($user),
                $previousStatus,
                AppointmentBooking::STATUS_CONFIRMED
            );

            DB::commit();

            // TODO: Send SMS confirmation
            // TODO: Send Email confirmation

            return response()->json([
                'status' => 200,
                'message' => 'Payment confirmed. Your appointment is now confirmed!',
                'booking' => [
                    'id' => $booking->id,
                    'token_number' => $booking->token_number,
                    'status' => $booking->status,
                    'appointment_date' => $booking->appointment_date->format('Y-m-d'),
                    'appointment_time' => Carbon::parse($booking->appointment_time)->format('h:i A'),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Confirm payment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to confirm payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get patient's appointments
     */
    public function getPatientAppointments(Request $request, string $patientId): JsonResponse
    {
        try {
            $status = $request->query('status', 'all'); // all, upcoming, past, cancelled

            $query = AppointmentBooking::with(['doctor', 'branch'])
                ->where('patient_id', $patientId)
                ->orderBy('appointment_date', 'desc')
                ->orderBy('appointment_time', 'desc');

            switch ($status) {
                case 'upcoming':
                    $query->where('appointment_date', '>=', now()->toDateString())
                          ->whereIn('status', [
                              AppointmentBooking::STATUS_PENDING_PAYMENT,
                              AppointmentBooking::STATUS_CONFIRMED,
                          ]);
                    break;
                case 'past':
                    $query->where(function ($q) {
                        $q->where('appointment_date', '<', now()->toDateString())
                          ->orWhereIn('status', [
                              AppointmentBooking::STATUS_COMPLETED,
                              AppointmentBooking::STATUS_NO_SHOW,
                          ]);
                    });
                    break;
                case 'cancelled':
                    $query->whereIn('status', [
                        AppointmentBooking::STATUS_CANCELLED,
                        AppointmentBooking::STATUS_RESCHEDULED,
                    ]);
                    break;
            }

            $appointments = $query->get()->map(function ($apt) {
                return $this->formatAppointmentResponse($apt);
            });

            return response()->json([
                'status' => 200,
                'appointments' => $appointments,
                'total' => $appointments->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Get patient appointments error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get appointments',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel appointment (Patient initiated)
     * 
     * Requirements:
     * - Verify ownership (patient can only cancel their own appointments)
     * - Require explicit confirmation flag
     * - No refunds for patient-initiated cancellations
     * - Immediately release the appointment slot
     * - Full audit logging
     */
    public function cancelAppointment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
                'confirmed' => 'required|boolean',
            ]);

            // Security: Require explicit confirmation
            if (!$validated['confirmed']) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Cancellation must be explicitly confirmed',
                ], 400);
            }

            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            $user = $request->user();
            $userRole = $this->getUserRole($user);

            // Security: Verify ownership - Patient can only cancel their own appointments
            if ($userRole === AppointmentLog::ROLE_PATIENT) {
                if ($booking->patient_id !== $user->id) {
                    Log::warning('Unauthorized cancellation attempt', [
                        'booking_id' => $bookingId,
                        'booking_patient_id' => $booking->patient_id,
                        'requesting_user_id' => $user->id,
                    ]);
                    return response()->json([
                        'status' => 403,
                        'message' => 'You can only cancel your own appointments',
                    ], 403);
                }
            }

            // Check if appointment can be cancelled
            if (!$booking->canBeCancelled()) {
                $statusMessage = match($booking->status) {
                    AppointmentBooking::STATUS_CANCELLED => 'This appointment has already been cancelled.',
                    AppointmentBooking::STATUS_RESCHEDULED => 'This appointment has been rescheduled. Please check your current appointments for the active booking.',
                    AppointmentBooking::STATUS_CHECKED_IN => 'This appointment has already checked in and cannot be cancelled.',
                    AppointmentBooking::STATUS_IN_SESSION => 'This appointment is currently in session.',
                    AppointmentBooking::STATUS_COMPLETED => 'This appointment has already been completed.',
                    AppointmentBooking::STATUS_NO_SHOW => 'This appointment was marked as no-show.',
                    default => 'This appointment cannot be cancelled. It may have already been cancelled, started, or completed.',
                };
                return response()->json([
                    'status' => 400,
                    'message' => $statusMessage,
                    'current_status' => $booking->status,
                ], 400);
            }

            // Prevent double cancellation
            if ($booking->status === AppointmentBooking::STATUS_CANCELLED) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This appointment has already been cancelled',
                ], 400);
            }

            $settings = AppointmentSettings::getForBranch($booking->branch_id);

            // Check cancellation policy for patients (optional cutoff time)
            if ($userRole === AppointmentLog::ROLE_PATIENT && $settings->cancellation_advance_hours > 0) {
                if (!$settings->canCancelAppointment(
                    $booking->appointment_date->format('Y-m-d'),
                    $booking->appointment_time
                )) {
                    return response()->json([
                        'status' => 400,
                        'message' => "Appointments must be cancelled at least {$settings->cancellation_advance_hours} hours in advance",
                    ], 400);
                }
            }

            $previousStatus = $booking->status;
            $previousPaymentStatus = $booking->payment_status;

            DB::beginTransaction();

            // Step 1: Update appointment status to cancelled
            $booking->update([
                'status' => AppointmentBooking::STATUS_CANCELLED,
                'cancellation_reason' => $validated['reason'],
                'cancelled_by' => $user->id,
                'cancelled_by_role' => $userRole,
                'cancelled_at' => now(),
            ]);

            // Step 2: Log the cancellation with comprehensive audit data
            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_CANCELLED,
                $user->id,
                $userRole,
                $previousStatus,
                AppointmentBooking::STATUS_CANCELLED,
                $validated['reason'],
                [
                    'cancellation_type' => $userRole === AppointmentLog::ROLE_PATIENT ? 'patient_initiated' : 'staff_initiated',
                    'refund_status' => 'not_applicable',
                    'previous_payment_status' => $previousPaymentStatus,
                    'slot_number' => $booking->slot_number,
                    'token_number' => $booking->token_number,
                    'doctor_id' => $booking->doctor_id,
                    'appointment_date' => $booking->appointment_date->format('Y-m-d'),
                    'booking_fee' => $booking->booking_fee,
                ]
            );

            // Step 3: Slot Release - The slot is automatically released because:
            // - The UNIQUE constraint is on (doctor_id, appointment_date, slot_number) 
            // - Only non-cancelled bookings block slots (checked in createBooking)
            // - Cancelled bookings are excluded from slot availability checks
            // No additional action needed - slot becomes available immediately

            // Step 4: NO REFUND for patient-initiated cancellations
            // Payment record is maintained as non-refundable
            // Log this explicitly for audit trail
            if ($previousPaymentStatus === AppointmentBooking::PAYMENT_PAID) {
                AppointmentLog::log(
                    $booking->id,
                    'payment_retained',
                    $user->id,
                    $userRole,
                    null,
                    null,
                    'Payment retained - no refund for patient-initiated cancellation',
                    [
                        'amount_paid' => $booking->amount_paid,
                        'booking_fee' => $booking->booking_fee,
                        'refund_status' => 'not_applicable',
                        'reason' => 'patient_initiated_cancellation',
                    ]
                );
            }

            DB::commit();

            // Step 5: Send SMS notification to patient (asynchronous, non-blocking)
            try {
                $smsService = new AppointmentSmsService();
                $patientPhone = AppointmentSmsService::getPatientPhoneFromBooking($booking);
                
                if ($patientPhone) {
                    $appointmentDetails = AppointmentSmsService::getAppointmentDetailsForSms($booking);
                    $smsService->sendCancellationSms($booking, $patientPhone, $appointmentDetails);
                } else {
                    Log::warning('Cancellation SMS skipped: No patient phone number found', [
                        'booking_id' => $bookingId,
                        'patient_id' => $booking->patient_id,
                    ]);
                }
            } catch (\Exception $smsException) {
                // SMS failure should NOT affect cancellation success
                Log::error('Cancellation SMS error (non-blocking)', [
                    'booking_id' => $bookingId,
                    'error' => $smsException->getMessage(),
                ]);
            }

            // TODO: Send email notification to patient
            // TODO: Optionally notify doctor/branch admin

            Log::info('Appointment cancelled successfully', [
                'booking_id' => $bookingId,
                'patient_id' => $booking->patient_id,
                'cancelled_by' => $user->id,
                'user_role' => $userRole,
                'slot_number' => $booking->slot_number,
                'refund_status' => 'not_applicable',
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Appointment cancelled successfully. The slot has been released and is now available for other patients.',
                'data' => [
                    'booking_id' => $bookingId,
                    'cancelled_at' => now()->toIso8601String(),
                    'refund_status' => 'not_applicable',
                    'slot_released' => true,
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
            Log::error('Cancel appointment error: ' . $e->getMessage(), [
                'booking_id' => $bookingId,
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Failed to cancel appointment',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Get reschedule eligibility for an appointment
     * 
     * Returns whether the patient can reschedule, remaining attempts,
     * 24-hour rule status, and any restrictions.
     */
    public function getRescheduleEligibility(Request $request, string $bookingId): JsonResponse
    {
        try {
            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            $user = $request->user();
            $userRole = $this->getUserRole($user);

            // Ownership validation for patients
            if ($userRole === 'patient') {
                $patientId = $user->id;
                $patient = DB::table('patients')->where('user_id', $user->id)->first();
                if ($patient) {
                    $patientId = $patient->id;
                }

                if ($booking->patient_id !== $patientId && $booking->patient_id !== $user->id) {
                    return response()->json([
                        'status' => 403,
                        'message' => 'You can only check eligibility for your own appointments',
                    ], 403);
                }
            }

            // Get comprehensive eligibility
            $eligibility = $booking->getRescheduleEligibility();

            // Get appointment settings for additional info
            $settings = AppointmentSettings::getForBranch($booking->branch_id);

            return response()->json([
                'status' => 200,
                'can_reschedule' => $eligibility['can_reschedule'],
                'reason' => $eligibility['reason'],
                'remaining_attempts' => $eligibility['remaining_attempts'],
                'max_attempts' => $eligibility['max_attempts'],
                'is_admin_cancelled' => $eligibility['is_admin_cancelled'],
                'appointment_details' => [
                    'id' => $booking->id,
                    'date' => $booking->appointment_date->format('Y-m-d'),
                    'time' => $booking->appointment_time,
                    'doctor_id' => $booking->doctor_id,
                    'branch_id' => $booking->branch_id,
                    'status' => $booking->status,
                ],
                'settings' => [
                    'max_advance_booking_days' => $settings->max_advance_booking_days,
                    'reschedule_advance_hours' => 24, // Our 24-hour rule
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get reschedule eligibility error: ' . $e->getMessage(), [
                'booking_id' => $bookingId,
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Failed to check reschedule eligibility',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reschedule appointment - Enhanced with 24-hour rule and patient reschedule limits
     * 
     * Rules:
     * - 24-hour advance notice required for rescheduling
     * - Normal appointments: max 1 patient-initiated reschedule
     * - Admin-cancelled (for doctor): max 2 reschedules allowed
     * - Ownership validation for patients
     */
    public function rescheduleAppointment(Request $request, string $bookingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'new_date' => 'required|date|after_or_equal:today',
                'new_slot_number' => 'required|integer|min:1',
                'new_branch_id' => 'nullable|string|exists:branches,id', // Optional branch change
                'reason' => 'nullable|string|max:500',
                'confirmed' => 'required|boolean', // Patient must explicitly confirm
            ]);

            // Require explicit confirmation
            if (!$validated['confirmed']) {
                return response()->json([
                    'status' => 422,
                    'message' => 'You must confirm the reschedule action',
                ], 422);
            }

            $booking = AppointmentBooking::find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            $user = $request->user();
            $userRole = $this->getUserRole($user);

            // Ownership validation for patients
            if ($userRole === 'patient') {
                // Check if this booking belongs to the current patient
                $patientId = $user->id;
                
                // Also check via patients table if needed
                $patient = DB::table('patients')->where('user_id', $user->id)->first();
                if ($patient) {
                    $patientId = $patient->id;
                }

                if ($booking->patient_id !== $patientId && $booking->patient_id !== $user->id) {
                    Log::warning('Reschedule ownership mismatch', [
                        'booking_id' => $bookingId,
                        'booking_patient_id' => $booking->patient_id,
                        'request_user_id' => $user->id,
                        'patient_table_id' => $patient->id ?? null,
                    ]);
                    return response()->json([
                        'status' => 403,
                        'message' => 'You can only reschedule your own appointments',
                    ], 403);
                }
            }

            // Check base reschedule eligibility (status check)
            if (!$booking->canBeRescheduled()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This appointment cannot be rescheduled. Only confirmed appointments can be rescheduled.',
                ], 400);
            }

            // Get comprehensive reschedule eligibility for patients
            if ($userRole === 'patient') {
                $eligibility = $booking->getRescheduleEligibility();

                if (!$eligibility['can_reschedule']) {
                    return response()->json([
                        'status' => 400,
                        'message' => $eligibility['reason'],
                        'remaining_attempts' => $eligibility['remaining_attempts'],
                        'max_attempts' => $eligibility['max_attempts'],
                        'is_admin_cancelled' => $eligibility['is_admin_cancelled'],
                    ], 400);
                }
            } else {
                // For non-patients (staff), just check the 24-hour rule for fairness
                if (!$booking->meetsReschedule24HourRule()) {
                    return response()->json([
                        'status' => 400,
                        'message' => 'Rescheduling requires 24-hour advance notice before the appointment time.',
                    ], 400);
                }
            }

            $settings = AppointmentSettings::getForBranch($booking->branch_id);

            // Determine the target branch (new or same)
            $targetBranchId = $validated['new_branch_id'] ?? $booking->branch_id;

            // Validate new date is within booking limits
            if (!$settings->isDateWithinBookingLimit($validated['new_date'])) {
                return response()->json([
                    'status' => 400,
                    'message' => "Appointments can only be booked up to {$settings->max_advance_booking_days} days in advance",
                ], 400);
            }

            // Check new slot availability (exclude current booking from check)
            if (!AppointmentBooking::isSlotAvailable(
                $booking->doctor_id,
                $validated['new_date'],
                $validated['new_slot_number'],
                $targetBranchId,
                $booking->id  // Exclude current booking from availability check
            )) {
                return response()->json([
                    'status' => 400,
                    'message' => 'The selected slot is not available',
                ], 400);
            }

            DB::beginTransaction();

            // Calculate new reschedule counts
            $isAdminCancelled = $booking->cancelled_by_admin_for_doctor ?? false;
            $newPatientRescheduleCount = $booking->patient_reschedule_count ?? 0;
            $newAdminGrantedRescheduleCount = $booking->admin_granted_reschedule_count ?? 0;

            // Increment the appropriate counter for patient-initiated reschedules
            if ($userRole === 'patient') {
                if ($isAdminCancelled) {
                    $newAdminGrantedRescheduleCount++;
                } else {
                    $newPatientRescheduleCount++;
                }
            }

            // Mark old appointment as rescheduled
            $booking->update([
                'status' => AppointmentBooking::STATUS_RESCHEDULED,
            ]);

            // Get new appointment time
            $dayOfWeek = Carbon::parse($validated['new_date'])->format('l');
            $schedule = DB::table('doctor_schedules')
                ->where('doctor_id', $booking->doctor_id)
                ->where('branch_id', $targetBranchId)
                ->where('schedule_day', $dayOfWeek)
                ->first();

            if (!$schedule) {
                DB::rollBack();
                return response()->json([
                    'status' => 400,
                    'message' => 'No schedule found for the selected date and branch',
                ], 400);
            }

            $startTime = Carbon::parse($schedule->start_time);
            $timePerPatient = $schedule->time_per_patient ?? 15;
            $newAppointmentTime = $startTime->addMinutes(($validated['new_slot_number'] - 1) * $timePerPatient);

            // Create new appointment with proper reschedule tracking
            $newBooking = AppointmentBooking::create([
                'patient_id' => $booking->patient_id,
                'doctor_id' => $booking->doctor_id,
                'branch_id' => $targetBranchId,
                'schedule_id' => $schedule->id,
                'appointment_date' => $validated['new_date'],
                'appointment_time' => $newAppointmentTime->format('H:i:s'),
                'slot_number' => $validated['new_slot_number'],
                'token_number' => AppointmentBooking::getNextTokenNumber(
                    $booking->doctor_id,
                    $targetBranchId,
                    $validated['new_date']
                ),
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
                'booked_by_role' => $userRole,
                'reschedule_count' => $booking->reschedule_count + 1,
                'patient_reschedule_count' => $newPatientRescheduleCount,
                'admin_granted_reschedule_count' => $newAdminGrantedRescheduleCount,
                'cancelled_by_admin_for_doctor' => $isAdminCancelled, // Preserve the flag
                'original_appointment_id' => $booking->original_appointment_id ?? $booking->id,
            ]);

            // Log rescheduling with comprehensive details
            AppointmentLog::log(
                $booking->id,
                AppointmentLog::ACTION_RESCHEDULED,
                $user->id,
                $userRole,
                AppointmentBooking::STATUS_CONFIRMED,
                AppointmentBooking::STATUS_RESCHEDULED,
                $validated['reason'] ?? 'Rescheduled by ' . $userRole,
                [
                    'new_booking_id' => $newBooking->id,
                    'new_date' => $validated['new_date'],
                    'new_slot' => $validated['new_slot_number'],
                    'old_date' => $booking->appointment_date->format('Y-m-d'),
                    'old_slot' => $booking->slot_number,
                    'is_admin_cancelled_appointment' => $isAdminCancelled,
                    'patient_reschedule_count' => $newPatientRescheduleCount,
                    'admin_granted_reschedule_count' => $newAdminGrantedRescheduleCount,
                ]
            );

            DB::commit();

            // Send SMS notification after DB commit (non-blocking)
            try {
                $smsService = new \App\Services\AppointmentSmsService();
                $patientPhone = \App\Services\AppointmentSmsService::getPatientPhoneFromBooking($newBooking);
                
                if ($patientPhone) {
                    $appointmentDetails = \App\Services\AppointmentSmsService::getAppointmentDetailsForSms($newBooking);
                    $appointmentDetails['old_date'] = $booking->appointment_date->format('Y-m-d');
                    $appointmentDetails['new_date'] = $validated['new_date'];
                    $appointmentDetails['new_time'] = $newAppointmentTime->format('h:i A');
                    $appointmentDetails['new_token'] = $newBooking->token_number;
                    
                    $smsService->sendRescheduleSms($newBooking, $patientPhone, $appointmentDetails);
                }
            } catch (\Exception $smsError) {
                // Log SMS error but don't fail the reschedule
                Log::warning('Reschedule SMS failed (non-blocking)', [
                    'booking_id' => $newBooking->id,
                    'error' => $smsError->getMessage(),
                ]);
            }

            // Calculate remaining attempts for response
            $remainingAttempts = 0;
            if ($userRole === 'patient') {
                if ($isAdminCancelled) {
                    $remainingAttempts = max(0, 2 - $newAdminGrantedRescheduleCount);
                } else {
                    $remainingAttempts = max(0, 1 - $newPatientRescheduleCount);
                }
            }

            return response()->json([
                'status' => 200,
                'message' => 'Appointment rescheduled successfully',
                'new_booking' => [
                    'id' => $newBooking->id,
                    'token_number' => $newBooking->token_number,
                    'appointment_date' => $newBooking->appointment_date->format('Y-m-d'),
                    'appointment_time' => $newAppointmentTime->format('h:i A'),
                    'slot_number' => $newBooking->slot_number,
                ],
                'remaining_reschedule_attempts' => $remainingAttempts,
                'is_admin_cancelled_appointment' => $isAdminCancelled,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Reschedule appointment error: ' . $e->getMessage(), [
                'booking_id' => $bookingId ?? null,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 500,
                'message' => 'Failed to reschedule appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get appointment details
     */
    public function getAppointmentDetails(string $bookingId): JsonResponse
    {
        try {
            $booking = AppointmentBooking::with(['doctor', 'branch', 'patient', 'logs.performer'])
                ->find($bookingId);

            if (!$booking) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Booking not found',
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'appointment' => $this->formatAppointmentResponse($booking, true),
            ]);
        } catch (\Exception $e) {
            Log::error('Get appointment details error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get appointment details',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get branches list
     */
    public function getBranches(): JsonResponse
    {
        try {
            $branches = DB::table('branches')
                ->select('id', 'center_name', 'center_type')
                ->orderBy('center_name')
                ->get();

            return response()->json([
                'status' => 200,
                'branches' => $branches,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get branches',
            ], 500);
        }
    }

    /**
     * Get specializations list
     */
    public function getSpecializations(): JsonResponse
    {
        try {
            $specializations = DB::table('doctors')
                ->whereNotNull('areas_of_specialization')
                ->distinct()
                ->pluck('areas_of_specialization')
                ->filter()
                ->values();

            return response()->json([
                'status' => 200,
                'specializations' => $specializations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get specializations',
            ], 500);
        }
    }

    // Helper methods
    private function getUserRole($user): string
    {
        $roleMap = [
            1 => AppointmentLog::ROLE_SUPER_ADMIN,
            2 => AppointmentLog::ROLE_BRANCH_ADMIN,
            3 => AppointmentLog::ROLE_DOCTOR,
            4 => AppointmentLog::ROLE_RECEPTIONIST,
            // Add more as needed
        ];

        return $roleMap[$user->role_id ?? 0] ?? AppointmentLog::ROLE_PATIENT;
    }

    private function formatAppointmentResponse($booking, bool $includeDetails = false): array
    {
        $response = [
            'id' => $booking->id,
            'patient_id' => $booking->patient_id,
            'doctor_id' => $booking->doctor_id,
            'doctor_name' => $booking->doctor 
                ? trim($booking->doctor->first_name . ' ' . $booking->doctor->last_name) 
                : null,
            'branch_id' => $booking->branch_id,
            'branch_name' => $booking->branch->center_name ?? null,
            'appointment_date' => $booking->appointment_date->format('Y-m-d'),
            'appointment_time' => Carbon::parse($booking->appointment_time)->format('h:i A'),
            'slot_number' => $booking->slot_number,
            'token_number' => $booking->token_number,
            'appointment_type' => $booking->appointment_type,
            'booking_type' => $booking->booking_type,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'booking_fee' => $booking->booking_fee,
            'amount_paid' => $booking->amount_paid,
            'created_at' => $booking->created_at->format('Y-m-d H:i:s'),
        ];

        if ($includeDetails) {
            $response['notes'] = $booking->notes;
            $response['cancellation_reason'] = $booking->cancellation_reason;
            $response['reschedule_count'] = $booking->reschedule_count;
            $response['checked_in_at'] = $booking->checked_in_at?->format('Y-m-d H:i:s');
            $response['completed_at'] = $booking->completed_at?->format('Y-m-d H:i:s');
            $response['cancelled_at'] = $booking->cancelled_at?->format('Y-m-d H:i:s');
            
            if ($booking->relationLoaded('logs')) {
                $response['logs'] = $booking->logs->map(function ($log) {
                    return [
                        'action' => $log->action,
                        'action_label' => $log->getActionLabel(),
                        'performed_by' => $log->performer 
                            ? trim($log->performer->first_name . ' ' . $log->performer->last_name)
                            : 'System',
                        'performed_by_role' => $log->performed_by_role,
                        'reason' => $log->reason,
                        'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                    ];
                });
            }
        }

        return $response;
    }
}
