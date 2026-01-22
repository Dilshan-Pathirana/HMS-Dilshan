<?php

namespace App\Http\Controllers\Receptionist;

use App\Http\Controllers\Controller;
use App\Models\AllUsers\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ReceptionistDashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function getDashboardStats(): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();

            // Today's appointments count (using center_id if branch_id doesn't exist)
            $todayAppointments = 0;
            $pendingAppointments = 0;
            $completedToday = 0;
            $upcomingAppointments = collect([]);
            
            try {
                // Try with center_id (actual column name)
                $todayAppointments = DB::table('appointments')
                    ->whereDate('appointment_date', $today)
                    ->count();

                $pendingAppointments = DB::table('appointments')
                    ->whereDate('appointment_date', $today)
                    ->where('status', 'pending')
                    ->count();

                $completedToday = DB::table('appointments')
                    ->whereDate('appointment_date', $today)
                    ->where('status', 'completed')
                    ->count();

                // Upcoming appointments (next 2 hours)
                $upcomingAppointments = DB::table('appointments')
                    ->leftJoin('patients', 'appointments.patient_id', '=', 'patients.id')
                    ->leftJoin('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                    ->whereDate('appointments.appointment_date', $today)
                    ->where('appointments.appointment_time', '>=', now()->format('H:i:s'))
                    ->where('appointments.appointment_time', '<=', now()->addHours(2)->format('H:i:s'))
                    ->where('appointments.status', 'pending')
                    ->select(
                        'appointments.*',
                        DB::raw("COALESCE(patients.name, CONCAT(patients.first_name, ' ', patients.last_name)) as patient_name"),
                        'patients.phone as patient_phone',
                        DB::raw("COALESCE(doctors.name, CONCAT(doctors.first_name, ' ', doctors.last_name)) as doctor_name")
                    )
                    ->orderBy('appointments.appointment_time')
                    ->limit(5)
                    ->get();
            } catch (\Exception $e) {
                Log::warning('Error fetching appointments: ' . $e->getMessage());
            }

            // Registered patients today
            $registeredToday = DB::table('patients')
                ->where('branch_id', $branchId)
                ->whereDate('created_at', $today)
                ->count();

            // Queue count - check if table exists
            $currentQueue = 0;
            if (\Schema::hasTable('patient_queue')) {
                $currentQueue = DB::table('patient_queue')
                    ->where('branch_id', $branchId)
                    ->whereDate('created_at', $today)
                    ->whereIn('status', ['waiting', 'in_progress'])
                    ->count();
            }

            // Walk-ins today - check if table exists
            $walkInsToday = 0;
            if (\Schema::hasTable('visits')) {
                $walkInsToday = DB::table('visits')
                    ->where('branch_id', $branchId)
                    ->whereDate('created_at', $today)
                    ->where('visit_type', 'walk_in')
                    ->count();
            }

            return response()->json([
                'status' => 200,
                'message' => 'Dashboard stats fetched successfully',
                'data' => [
                    'todayAppointments' => $todayAppointments,
                    'pendingAppointments' => $pendingAppointments,
                    'registeredToday' => $registeredToday,
                    'completedToday' => $completedToday,
                    'currentQueue' => $currentQueue,
                    'walkInsToday' => $walkInsToday,
                    'upcomingAppointments' => $upcomingAppointments,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching dashboard stats: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats',
            ], 500);
        }
    }

    /**
     * Get all branches
     */
    public function getBranches(): JsonResponse
    {
        try {
            $branches = DB::table('branches')
                ->select('id', 'center_name as name')
                ->orderBy('center_name')
                ->get();

            return response()->json([
                'status' => 200,
                'message' => 'Branches fetched successfully',
                'data' => $branches,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching branches: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch branches',
            ], 500);
        }
    }

    /**
     * Get patients list
     */
    public function getPatients(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $perPage = $request->get('per_page', 20);

            $patients = DB::table('patients')
                ->where('branch_id', $branchId)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'status' => 200,
                'message' => 'Patients fetched successfully',
                'data' => $patients,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching patients: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch patients',
            ], 500);
        }
    }

    /**
     * Search patients
     */
    public function searchPatients(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search', '');
            $branchId = $request->get('branch_id', '');
            $city = $request->get('city', '');

            // Query all patients regardless of branch with branch name join
            $query = DB::table('patients')
                ->leftJoin('branches', 'patients.branch_id', '=', 'branches.id')
                ->select('patients.*', 'branches.center_name as branch_name');
            
            // Apply search filter if provided
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('patients.name', 'like', "%{$search}%")
                        ->orWhere('patients.first_name', 'like', "%{$search}%")
                        ->orWhere('patients.last_name', 'like', "%{$search}%")
                        ->orWhere('patients.patient_id', 'like', "%{$search}%")
                        ->orWhere('patients.phone', 'like', "%{$search}%")
                        ->orWhere('patients.phone_number', 'like', "%{$search}%")
                        ->orWhere('patients.nic', 'like', "%{$search}%");
                });
            }
            
            // Apply branch filter if provided
            if (!empty($branchId)) {
                $query->where('patients.branch_id', $branchId);
            }
            
            // Apply city filter if provided
            if (!empty($city)) {
                $query->where('patients.city', $city);
            }
            
            $patients = $query->orderBy('patients.name')
                ->limit(100) // Increased limit to show more patients
                ->get();

            return response()->json([
                'status' => 200,
                'message' => 'Patients searched successfully',
                'data' => $patients,
            ]);
        } catch (\Exception $e) {
            Log::error('Error searching patients: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to search patients',
            ], 500);
        }
    }

    /**
     * Register new patient
     */
    public function registerPatient(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'date_of_birth' => 'nullable|date',
                'age' => 'nullable|integer|min:0|max:150',
                'gender' => 'required|in:male,female,other',
                'phone' => 'required|string|max:20|unique:patients,phone',
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:100',
                'branch_id' => 'nullable|string',
                'nic' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'blood_type' => 'nullable|string|max:5',
                'emergency_contact' => 'nullable|string|max:20',
                'emergency_contact_name' => 'nullable|string|max:255',
                'password' => 'required|string|min:6',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $currentUser = Auth::user();
            $branchId = $request->branch_id ?? $currentUser->branch_id;

            // Start transaction
            DB::beginTransaction();

            // Parse name into first and last name
            $nameParts = explode(' ', $request->name, 2);
            $firstName = $nameParts[0];
            $lastName = isset($nameParts[1]) ? $nameParts[1] : '';

            // Create user account for the patient using the User model (for proper UUID handling)
            $user = User::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $request->email ?? $request->phone . '@patient.hospital.com',
                'phone' => $request->phone,
                'password' => $request->password, // Will be hashed by the model's cast
                'role_as' => 6, // Patient role
                'user_type' => 'Patient',
                'branch_id' => $branchId,
                'gender' => $request->gender,
                'date_of_birth' => $request->date_of_birth,
                'address' => $request->address,
            ]);

            $userId = $user->id;

            // Generate unique patient ID
            $lastPatient = DB::table('patients')
                ->where('branch_id', $branchId)
                ->orderBy('id', 'desc')
                ->first();
            
            $patientNumber = $lastPatient ? ($lastPatient->id + 1) : 1;
            $patientId = 'PT-' . str_pad($branchId, 2, '0', STR_PAD_LEFT) . '-' . str_pad($patientNumber, 5, '0', STR_PAD_LEFT);

            // Build patient data with correct column mappings
            $patientData = [
                'patient_id' => $patientId,
                'user_id' => $userId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'name' => $request->name,
                'phone' => $request->phone,
                'phone_number' => $request->phone, // Required field in original schema
                'email' => $request->email,
                'date_of_birth' => $request->date_of_birth ?? now()->subYears(30)->format('Y-m-d'),
                'age' => $request->age,
                'gender' => $request->gender,
                'address' => $request->address ?? 'Not provided',
                'city' => $request->city ?? 'Not specified', // Use city from request or default
                'nic' => $request->nic,
                'blood_type' => $request->blood_type,
                'blood_group' => $request->blood_type,
                'emergency_contact' => $request->emergency_contact,
                'emergency_contact_name' => $request->emergency_contact_name,
                'emergency_contact_phone' => $request->emergency_contact,
                'branch_id' => $branchId,
                'center_id' => 1, // Default center
                'unique_registration_number' => $patientId,
                'registered_by' => $currentUser->id,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $id = DB::table('patients')->insertGetId($patientData);

            DB::commit();

            $patient = DB::table('patients')->find($id);

            return response()->json([
                'status' => 201,
                'message' => 'Patient registered successfully. Login: Phone Number as username.',
                'data' => $patient,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error registering patient: ' . $e->getMessage());
            
            // Parse error message to provide user-friendly feedback
            $errorMessage = $e->getMessage();
            $userFriendlyMessage = 'Failed to register patient. Please try again.';
            
            if (str_contains($errorMessage, 'UNIQUE constraint failed: users.email')) {
                $userFriendlyMessage = 'This email address is already registered. Please use a different email or leave it empty.';
            } elseif (str_contains($errorMessage, 'UNIQUE constraint failed: users.phone')) {
                $userFriendlyMessage = 'This phone number is already registered. Please use a different phone number.';
            } elseif (str_contains($errorMessage, 'UNIQUE constraint failed: patients.phone')) {
                $userFriendlyMessage = 'A patient with this phone number already exists. Please search for the existing patient instead.';
            } elseif (str_contains($errorMessage, 'UNIQUE constraint failed')) {
                $userFriendlyMessage = 'A patient with these details already exists. Please check and try again.';
            } elseif (str_contains($errorMessage, 'NOT NULL constraint failed')) {
                $userFriendlyMessage = 'Please fill in all required fields (Name, Phone, Gender, Date of Birth).';
            }
            
            return response()->json([
                'status' => 500,
                'message' => $userFriendlyMessage,
            ], 500);
        }
    }

    /**
     * Get patient details
     */
    public function getPatientDetails(int $patientId): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $patient = DB::table('patients')
                ->where('id', $patientId)
                ->where('branch_id', $branchId)
                ->first();

            if (!$patient) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Patient not found',
                ], 404);
            }

            // Get visit history
            $visits = DB::table('visits')
                ->where('patient_id', $patientId)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            // Get appointment history
            $appointments = DB::table('appointments')
                ->leftJoin('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->where('appointments.patient_id', $patientId)
                ->select('appointments.*', 'doctors.name as doctor_name')
                ->orderBy('appointments.appointment_date', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'status' => 200,
                'message' => 'Patient details fetched successfully',
                'data' => [
                    'patient' => $patient,
                    'visits' => $visits,
                    'appointments' => $appointments,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching patient details: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch patient details',
            ], 500);
        }
    }

    /**
     * Update patient (non-clinical details only)
     */
    public function updatePatient(Request $request, int $patientId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'email' => 'nullable|email|max:255',
                'emergency_contact' => 'nullable|string|max:20',
                'emergency_contact_name' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;

            $patient = DB::table('patients')
                ->where('id', $patientId)
                ->where('branch_id', $branchId)
                ->first();

            if (!$patient) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Patient not found',
                ], 404);
            }

            DB::table('patients')
                ->where('id', $patientId)
                ->update(array_merge($validator->validated(), [
                    'updated_at' => now(),
                ]));

            $updatedPatient = DB::table('patients')->find($patientId);

            return response()->json([
                'status' => 200,
                'message' => 'Patient updated successfully',
                'data' => $updatedPatient,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating patient: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update patient',
            ], 500);
        }
    }

    /**
     * Get appointments list
     */
    public function getAppointments(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->get('date', Carbon::today()->format('Y-m-d'));
            $status = $request->get('status', null);
            $perPage = $request->get('per_page', 20);

            $query = DB::table('appointments')
                ->leftJoin('patients', 'appointments.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->where('appointments.branch_id', $branchId)
                ->whereDate('appointments.appointment_date', $date)
                ->select(
                    'appointments.*',
                    'patients.name as patient_name',
                    'patients.phone as patient_phone',
                    'patients.patient_id as patient_code',
                    'doctors.name as doctor_name'
                );

            if ($status) {
                $query->where('appointments.status', $status);
            }

            $appointments = $query->orderBy('appointments.appointment_time')
                ->paginate($perPage);

            return response()->json([
                'status' => 200,
                'message' => 'Appointments fetched successfully',
                'data' => $appointments,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching appointments: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch appointments',
            ], 500);
        }
    }

    /**
     * Create appointment
     */
    public function createAppointment(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'patient_id' => 'required|integer|exists:patients,id',
                'doctor_id' => 'required|integer|exists:users,id',
                'appointment_date' => 'required|date|after_or_equal:today',
                'appointment_time' => 'required|string',
                'department' => 'nullable|string|max:100',
                'reason' => 'nullable|string|max:500',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;

            // Generate appointment number
            $today = Carbon::today();
            $appointmentCount = DB::table('appointments')
                ->where('branch_id', $branchId)
                ->whereDate('appointment_date', $request->appointment_date)
                ->count();
            
            $appointmentNumber = $appointmentCount + 1;
            $appointmentToken = 'A' . str_pad($appointmentNumber, 3, '0', STR_PAD_LEFT);

            $appointmentData = array_merge($validator->validated(), [
                'branch_id' => $branchId,
                'appointment_number' => $appointmentToken,
                'status' => 'pending',
                'created_by' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $id = DB::table('appointments')->insertGetId($appointmentData);

            $appointment = DB::table('appointments')
                ->leftJoin('patients', 'appointments.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->where('appointments.id', $id)
                ->select(
                    'appointments.*',
                    'patients.name as patient_name',
                    'doctors.name as doctor_name'
                )
                ->first();

            return response()->json([
                'status' => 201,
                'message' => 'Appointment created successfully',
                'data' => $appointment,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating appointment: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create appointment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get appointment details
     */
    public function getAppointmentDetails(int $appointmentId): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $appointment = DB::table('appointments')
                ->leftJoin('patients', 'appointments.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->where('appointments.id', $appointmentId)
                ->where('appointments.branch_id', $branchId)
                ->select(
                    'appointments.*',
                    'patients.name as patient_name',
                    'patients.phone as patient_phone',
                    'patients.patient_id as patient_code',
                    'doctors.name as doctor_name'
                )
                ->first();

            if (!$appointment) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Appointment not found',
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Appointment details fetched successfully',
                'data' => $appointment,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching appointment details: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch appointment details',
            ], 500);
        }
    }

    /**
     * Update appointment
     */
    public function updateAppointment(Request $request, int $appointmentId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'nullable|in:pending,confirmed,in_progress,completed,cancelled,no_show',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;

            $appointment = DB::table('appointments')
                ->where('id', $appointmentId)
                ->where('branch_id', $branchId)
                ->first();

            if (!$appointment) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Appointment not found',
                ], 404);
            }

            DB::table('appointments')
                ->where('id', $appointmentId)
                ->update(array_merge($validator->validated(), [
                    'updated_at' => now(),
                ]));

            return response()->json([
                'status' => 200,
                'message' => 'Appointment updated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating appointment: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update appointment',
            ], 500);
        }
    }

    /**
     * Cancel appointment
     */
    public function cancelAppointment(Request $request, int $appointmentId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;

            $appointment = DB::table('appointments')
                ->where('id', $appointmentId)
                ->where('branch_id', $branchId)
                ->first();

            if (!$appointment) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Appointment not found',
                ], 404);
            }

            DB::table('appointments')
                ->where('id', $appointmentId)
                ->update([
                    'status' => 'cancelled',
                    'cancellation_reason' => $request->reason,
                    'cancelled_by' => $user->id,
                    'cancelled_at' => now(),
                    'updated_at' => now(),
                ]);

            return response()->json([
                'status' => 200,
                'message' => 'Appointment cancelled successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error cancelling appointment: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to cancel appointment',
            ], 500);
        }
    }

    /**
     * Reschedule appointment
     */
    public function rescheduleAppointment(Request $request, int $appointmentId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'appointment_date' => 'required|date|after_or_equal:today',
                'appointment_time' => 'required|string',
                'reason' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;

            $appointment = DB::table('appointments')
                ->where('id', $appointmentId)
                ->where('branch_id', $branchId)
                ->first();

            if (!$appointment) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Appointment not found',
                ], 404);
            }

            DB::table('appointments')
                ->where('id', $appointmentId)
                ->update([
                    'appointment_date' => $request->appointment_date,
                    'appointment_time' => $request->appointment_time,
                    'reschedule_reason' => $request->reason,
                    'rescheduled_by' => $user->id,
                    'rescheduled_at' => now(),
                    'updated_at' => now(),
                ]);

            return response()->json([
                'status' => 200,
                'message' => 'Appointment rescheduled successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error rescheduling appointment: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to reschedule appointment',
            ], 500);
        }
    }

    /**
     * Get doctors list
     */
    public function getDoctors(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $doctors = DB::table('users')
                ->where('branch_id', $branchId)
                ->where('role', 'doctor')
                ->where('is_active', true)
                ->select('id', 'name', 'email', 'specialization', 'department')
                ->orderBy('name')
                ->get();

            return response()->json([
                'status' => 200,
                'message' => 'Doctors fetched successfully',
                'data' => $doctors,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching doctors: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch doctors',
            ], 500);
        }
    }

    /**
     * Get doctor availability
     */
    public function getDoctorAvailability(Request $request, int $doctorId): JsonResponse
    {
        try {
            $date = $request->get('date', Carbon::today()->format('Y-m-d'));

            // Get doctor's schedule for the date
            $schedule = DB::table('doctor_schedules')
                ->where('doctor_id', $doctorId)
                ->where('day_of_week', Carbon::parse($date)->dayOfWeek)
                ->first();

            // Get booked appointments for the date
            $bookedSlots = DB::table('appointments')
                ->where('doctor_id', $doctorId)
                ->whereDate('appointment_date', $date)
                ->whereNotIn('status', ['cancelled'])
                ->pluck('appointment_time')
                ->toArray();

            return response()->json([
                'status' => 200,
                'message' => 'Doctor availability fetched successfully',
                'data' => [
                    'schedule' => $schedule,
                    'booked_slots' => $bookedSlots,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching doctor availability: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch doctor availability',
            ], 500);
        }
    }

    /**
     * Get departments
     */
    public function getDepartments(): JsonResponse
    {
        try {
            $departments = DB::table('departments')
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            // If no departments table, return default list
            if ($departments->isEmpty()) {
                $departments = collect([
                    ['id' => 1, 'name' => 'General Medicine'],
                    ['id' => 2, 'name' => 'Homeopathy'],
                    ['id' => 3, 'name' => 'Pediatrics'],
                    ['id' => 4, 'name' => 'Dermatology'],
                    ['id' => 5, 'name' => 'Orthopedics'],
                    ['id' => 6, 'name' => 'Gynecology'],
                    ['id' => 7, 'name' => 'ENT'],
                    ['id' => 8, 'name' => 'Cardiology'],
                ]);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Departments fetched successfully',
                'data' => $departments,
            ]);
        } catch (\Exception $e) {
            // Return default departments on error
            return response()->json([
                'status' => 200,
                'message' => 'Departments fetched successfully',
                'data' => [
                    ['id' => 1, 'name' => 'General Medicine'],
                    ['id' => 2, 'name' => 'Homeopathy'],
                    ['id' => 3, 'name' => 'Pediatrics'],
                    ['id' => 4, 'name' => 'Dermatology'],
                ],
            ]);
        }
    }

    /**
     * Get patient queue
     */
    public function getQueue(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();

            $queue = DB::table('patient_queue')
                ->leftJoin('patients', 'patient_queue.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'patient_queue.doctor_id', '=', 'doctors.id')
                ->where('patient_queue.branch_id', $branchId)
                ->whereDate('patient_queue.created_at', $today)
                ->select(
                    'patient_queue.*',
                    'patients.name as patient_name',
                    'patients.phone as patient_phone',
                    'patients.patient_id as patient_code',
                    'doctors.name as doctor_name'
                )
                ->orderBy('patient_queue.priority', 'desc')
                ->orderBy('patient_queue.token_number')
                ->get();

            return response()->json([
                'status' => 200,
                'message' => 'Queue fetched successfully',
                'data' => $queue,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching queue: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch queue',
            ], 500);
        }
    }

    /**
     * Issue queue token
     */
    public function issueToken(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'patient_id' => 'required|integer|exists:patients,id',
                'doctor_id' => 'nullable|integer|exists:users,id',
                'visit_type' => 'required|in:appointment,walk_in',
                'priority' => 'nullable|in:normal,priority,emergency',
                'department' => 'nullable|string|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();

            // Get next token number
            $lastToken = DB::table('patient_queue')
                ->where('branch_id', $branchId)
                ->whereDate('created_at', $today)
                ->orderBy('token_number', 'desc')
                ->first();

            $tokenNumber = $lastToken ? ($lastToken->token_number + 1) : 1;

            $queueData = [
                'patient_id' => $request->patient_id,
                'doctor_id' => $request->doctor_id,
                'branch_id' => $branchId,
                'token_number' => $tokenNumber,
                'visit_type' => $request->visit_type,
                'priority' => $request->priority ?? 'normal',
                'department' => $request->department,
                'status' => 'waiting',
                'created_by' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $id = DB::table('patient_queue')->insertGetId($queueData);

            $queueItem = DB::table('patient_queue')
                ->leftJoin('patients', 'patient_queue.patient_id', '=', 'patients.id')
                ->where('patient_queue.id', $id)
                ->select('patient_queue.*', 'patients.name as patient_name')
                ->first();

            return response()->json([
                'status' => 201,
                'message' => 'Token issued successfully',
                'data' => $queueItem,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error issuing token: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to issue token: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update queue status
     */
    public function updateQueueStatus(Request $request, int $queueId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:waiting,in_progress,with_doctor,completed,cancelled',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;

            $queueItem = DB::table('patient_queue')
                ->where('id', $queueId)
                ->where('branch_id', $branchId)
                ->first();

            if (!$queueItem) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Queue item not found',
                ], 404);
            }

            $updateData = [
                'status' => $request->status,
                'updated_at' => now(),
            ];

            if ($request->status === 'in_progress' || $request->status === 'with_doctor') {
                $updateData['called_at'] = now();
            }

            if ($request->status === 'completed') {
                $updateData['completed_at'] = now();
            }

            DB::table('patient_queue')
                ->where('id', $queueId)
                ->update($updateData);

            return response()->json([
                'status' => 200,
                'message' => 'Queue status updated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating queue status: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update queue status',
            ], 500);
        }
    }

    /**
     * Get queue statistics
     */
    public function getQueueStats(): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();

            $waiting = DB::table('patient_queue')
                ->where('branch_id', $branchId)
                ->whereDate('created_at', $today)
                ->where('status', 'waiting')
                ->count();

            $inProgress = DB::table('patient_queue')
                ->where('branch_id', $branchId)
                ->whereDate('created_at', $today)
                ->whereIn('status', ['in_progress', 'with_doctor'])
                ->count();

            $completed = DB::table('patient_queue')
                ->where('branch_id', $branchId)
                ->whereDate('created_at', $today)
                ->where('status', 'completed')
                ->count();

            $avgWaitTime = DB::table('patient_queue')
                ->where('branch_id', $branchId)
                ->whereDate('created_at', $today)
                ->whereNotNull('called_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)) as avg_wait')
                ->first();

            return response()->json([
                'status' => 200,
                'message' => 'Queue stats fetched successfully',
                'data' => [
                    'waiting' => $waiting,
                    'inProgress' => $inProgress,
                    'completed' => $completed,
                    'avgWaitTime' => round($avgWaitTime->avg_wait ?? 0),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching queue stats: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch queue stats',
            ], 500);
        }
    }

    /**
     * Get visits
     */
    public function getVisits(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->get('date', Carbon::today()->format('Y-m-d'));
            $perPage = $request->get('per_page', 20);

            $visits = DB::table('visits')
                ->leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
                ->where('visits.branch_id', $branchId)
                ->whereDate('visits.created_at', $date)
                ->select(
                    'visits.*',
                    'patients.name as patient_name',
                    'patients.phone as patient_phone',
                    'patients.patient_id as patient_code',
                    'doctors.name as doctor_name'
                )
                ->orderBy('visits.created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'status' => 200,
                'message' => 'Visits fetched successfully',
                'data' => $visits,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching visits: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch visits',
            ], 500);
        }
    }

    /**
     * Create visit record
     */
    public function createVisit(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'patient_id' => 'required|integer|exists:patients,id',
                'doctor_id' => 'nullable|integer|exists:users,id',
                'visit_type' => 'required|in:opd,follow_up,walk_in,emergency',
                'department' => 'nullable|string|max:100',
                'reason' => 'nullable|string|max:500',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;

            // Generate visit number
            $today = Carbon::today();
            $visitCount = DB::table('visits')
                ->where('branch_id', $branchId)
                ->whereDate('created_at', $today)
                ->count();
            
            $visitNumber = 'V' . $today->format('Ymd') . '-' . str_pad($visitCount + 1, 4, '0', STR_PAD_LEFT);

            $visitData = array_merge($validator->validated(), [
                'branch_id' => $branchId,
                'visit_number' => $visitNumber,
                'status' => 'registered',
                'created_by' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $id = DB::table('visits')->insertGetId($visitData);

            $visit = DB::table('visits')
                ->leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
                ->where('visits.id', $id)
                ->select(
                    'visits.*',
                    'patients.name as patient_name',
                    'doctors.name as doctor_name'
                )
                ->first();

            return response()->json([
                'status' => 201,
                'message' => 'Visit created successfully',
                'data' => $visit,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating visit: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create visit: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get visit details
     */
    public function getVisitDetails(int $visitId): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $visit = DB::table('visits')
                ->leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
                ->where('visits.id', $visitId)
                ->where('visits.branch_id', $branchId)
                ->select(
                    'visits.*',
                    'patients.name as patient_name',
                    'patients.phone as patient_phone',
                    'patients.patient_id as patient_code',
                    'doctors.name as doctor_name'
                )
                ->first();

            if (!$visit) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Visit not found',
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Visit details fetched successfully',
                'data' => $visit,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching visit details: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch visit details',
            ], 500);
        }
    }

    /**
     * Update visit
     */
    public function updateVisit(Request $request, int $visitId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'nullable|in:registered,with_doctor,lab,pharmacy,completed',
                'doctor_id' => 'nullable|integer|exists:users,id',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;

            $visit = DB::table('visits')
                ->where('id', $visitId)
                ->where('branch_id', $branchId)
                ->first();

            if (!$visit) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Visit not found',
                ], 404);
            }

            DB::table('visits')
                ->where('id', $visitId)
                ->update(array_merge($validator->validated(), [
                    'updated_at' => now(),
                ]));

            return response()->json([
                'status' => 200,
                'message' => 'Visit updated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating visit: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update visit',
            ], 500);
        }
    }

    /**
     * Print visit slip
     */
    public function printVisitSlip(int $visitId): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $visit = DB::table('visits')
                ->leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
                ->leftJoin('branches', 'visits.branch_id', '=', 'branches.id')
                ->where('visits.id', $visitId)
                ->where('visits.branch_id', $branchId)
                ->select(
                    'visits.*',
                    'patients.name as patient_name',
                    'patients.phone as patient_phone',
                    'patients.patient_id as patient_code',
                    'patients.age as patient_age',
                    'patients.gender as patient_gender',
                    'doctors.name as doctor_name',
                    'branches.name as branch_name',
                    'branches.address as branch_address'
                )
                ->first();

            if (!$visit) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Visit not found',
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Visit slip data fetched successfully',
                'data' => $visit,
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating visit slip: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to generate visit slip',
            ], 500);
        }
    }

    /**
     * Get daily registrations report
     */
    public function getDailyRegistrationsReport(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->get('date', Carbon::today()->format('Y-m-d'));

            $registrations = DB::table('patients')
                ->where('branch_id', $branchId)
                ->whereDate('created_at', $date)
                ->select('id', 'patient_id', 'name', 'phone', 'gender', 'age', 'created_at')
                ->orderBy('created_at')
                ->get();

            return response()->json([
                'status' => 200,
                'message' => 'Daily registrations report fetched successfully',
                'data' => [
                    'date' => $date,
                    'total' => $registrations->count(),
                    'registrations' => $registrations,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching daily registrations report: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch report',
            ], 500);
        }
    }

    /**
     * Get appointments report
     */
    public function getAppointmentsReport(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->get('date', Carbon::today()->format('Y-m-d'));

            $appointments = DB::table('appointments')
                ->leftJoin('patients', 'appointments.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->where('appointments.branch_id', $branchId)
                ->whereDate('appointments.appointment_date', $date)
                ->select(
                    'appointments.*',
                    'patients.name as patient_name',
                    'doctors.name as doctor_name'
                )
                ->orderBy('appointments.appointment_time')
                ->get();

            $stats = [
                'total' => $appointments->count(),
                'pending' => $appointments->where('status', 'pending')->count(),
                'confirmed' => $appointments->where('status', 'confirmed')->count(),
                'completed' => $appointments->where('status', 'completed')->count(),
                'cancelled' => $appointments->where('status', 'cancelled')->count(),
                'no_show' => $appointments->where('status', 'no_show')->count(),
            ];

            return response()->json([
                'status' => 200,
                'message' => 'Appointments report fetched successfully',
                'data' => [
                    'date' => $date,
                    'stats' => $stats,
                    'appointments' => $appointments,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching appointments report: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch report',
            ], 500);
        }
    }

    /**
     * Get no-shows report
     */
    public function getNoShowsReport(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $startDate = $request->get('start_date', Carbon::today()->subDays(7)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::today()->format('Y-m-d'));

            $noShows = DB::table('appointments')
                ->leftJoin('patients', 'appointments.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->where('appointments.branch_id', $branchId)
                ->whereBetween('appointments.appointment_date', [$startDate, $endDate])
                ->where('appointments.status', 'no_show')
                ->select(
                    'appointments.*',
                    'patients.name as patient_name',
                    'patients.phone as patient_phone',
                    'doctors.name as doctor_name'
                )
                ->orderBy('appointments.appointment_date', 'desc')
                ->get();

            return response()->json([
                'status' => 200,
                'message' => 'No-shows report fetched successfully',
                'data' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'total' => $noShows->count(),
                    'no_shows' => $noShows,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching no-shows report: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch report',
            ], 500);
        }
    }

    /**
     * Get walk-ins report
     */
    public function getWalkInsReport(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->get('date', Carbon::today()->format('Y-m-d'));

            $walkIns = DB::table('visits')
                ->leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
                ->where('visits.branch_id', $branchId)
                ->whereDate('visits.created_at', $date)
                ->where('visits.visit_type', 'walk_in')
                ->select(
                    'visits.*',
                    'patients.name as patient_name',
                    'doctors.name as doctor_name'
                )
                ->orderBy('visits.created_at')
                ->get();

            $appointments = DB::table('appointments')
                ->where('branch_id', $branchId)
                ->whereDate('appointment_date', $date)
                ->count();

            return response()->json([
                'status' => 200,
                'message' => 'Walk-ins report fetched successfully',
                'data' => [
                    'date' => $date,
                    'walk_ins_count' => $walkIns->count(),
                    'appointments_count' => $appointments,
                    'walk_ins' => $walkIns,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching walk-ins report: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch report',
            ], 500);
        }
    }

    /**
     * Get profile
     */
    public function getProfile(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            $branch = DB::table('branches')
                ->where('id', $user->branch_id)
                ->first();

            return response()->json([
                'status' => 200,
                'message' => 'Profile fetched successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'employee_id' => $user->employee_id ?? 'REC-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                    'branch' => $branch ? $branch->name : 'Not assigned',
                    'branch_id' => $user->branch_id,
                    'joined_date' => $user->created_at,
                    'profile_picture' => $user->profile_picture,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching profile: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch profile',
            ], 500);
        }
    }

    /**
     * Update profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $user->update($validator->validated());

            return response()->json([
                'status' => 200,
                'message' => 'Profile updated successfully',
                'data' => $user,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating profile: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update profile',
            ], 500);
        }
    }

    /**
     * Change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();

            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'status' => 401,
                    'message' => 'Current password is incorrect',
                ], 401);
            }

            $user->update([
                'password' => Hash::make($request->new_password),
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Password changed successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error changing password: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to change password',
            ], 500);
        }
    }
}
