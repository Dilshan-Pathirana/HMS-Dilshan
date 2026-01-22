<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use App\Models\NursePatientAssignment;
use App\Models\NurseShiftLog;
use App\Models\Patient;
use App\Models\PatientVitalSign;
use App\Models\ShiftHandover;
use App\Models\AllUsers\User;
use App\Response\CommonResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class NurseDashboardController extends Controller
{
    /**
     * Get nurse dashboard statistics
     */
    public function getDashboardStats(): JsonResponse
    {
        try {
            $user = Auth::user();
            $nurseId = $user->id;
            $branchId = $user->medical_center_id;
            $today = Carbon::today();

            // Assigned patients count
            $assignedPatients = NursePatientAssignment::forNurse($nurseId)
                ->forBranch($branchId)
                ->active()
                ->today()
                ->count();

            // Vital signs recorded today
            $vitalSignsRecorded = PatientVitalSign::forNurse($nurseId)
                ->forBranch($branchId)
                ->whereDate('recorded_at', $today)
                ->count();

            // Critical alerts (abnormal vital signs today)
            $criticalAlerts = PatientVitalSign::forBranch($branchId)
                ->whereDate('recorded_at', $today)
                ->where('is_abnormal', true)
                ->count();

            // Pending handovers to acknowledge
            $pendingHandovers = ShiftHandover::forBranch($branchId)
                ->where('to_nurse_id', $nurseId)
                ->pending()
                ->count();

            // Current shift status
            $currentShift = NurseShiftLog::forNurse($nurseId)
                ->forBranch($branchId)
                ->today()
                ->first();

            // Recent vital signs recorded
            $recentVitalSigns = PatientVitalSign::forNurse($nurseId)
                ->forBranch($branchId)
                ->with('patient:id,name')
                ->orderBy('recorded_at', 'desc')
                ->limit(5)
                ->get();

            // Upcoming shifts (next 7 days)
            $upcomingShifts = NurseShiftLog::forNurse($nurseId)
                ->forBranch($branchId)
                ->where('shift_date', '>', $today)
                ->where('shift_date', '<=', $today->copy()->addDays(7))
                ->orderBy('shift_date')
                ->orderBy('scheduled_start')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => [
                    'assignedPatients' => $assignedPatients,
                    'vitalSignsRecorded' => $vitalSignsRecorded,
                    'criticalAlerts' => $criticalAlerts,
                    'pendingHandovers' => $pendingHandovers,
                    'currentShift' => $currentShift,
                    'recentVitalSigns' => $recentVitalSigns,
                    'upcomingShifts' => $upcomingShifts,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching nurse dashboard stats: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get assigned patients list with optional ward filter
     */
    public function getPatients(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $nurseId = $user->id;
            $branchId = $user->medical_center_id;

            $query = NursePatientAssignment::forNurse($nurseId)
                ->forBranch($branchId)
                ->active()
                ->with(['patient' => function ($q) {
                    $q->select('id', 'name', 'phone', 'registration_number', 'gender', 'age', 'blood_type');
                }]);

            // Filter by ward
            if ($request->has('ward') && $request->ward) {
                $query->forWard($request->ward);
            }

            // Filter by shift
            if ($request->has('shift') && $request->shift) {
                $query->forShift($request->shift);
            }

            // Filter by date (default: today)
            $date = $request->get('date', Carbon::today()->toDateString());
            $query->whereDate('assigned_date', $date);

            $assignments = $query->orderBy('is_primary', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            // Get latest vital signs for each patient
            $patientIds = $assignments->pluck('patient_id')->unique();
            $latestVitals = PatientVitalSign::whereIn('patient_id', $patientIds)
                ->select('patient_id', DB::raw('MAX(recorded_at) as latest_recorded'))
                ->groupBy('patient_id')
                ->get()
                ->keyBy('patient_id');

            // Append latest vital time to each assignment
            $assignments = $assignments->map(function ($assignment) use ($latestVitals) {
                $assignment->latest_vital_recorded = $latestVitals[$assignment->patient_id]->latest_recorded ?? null;
                return $assignment;
            });

            return response()->json([
                'status' => 200,
                'data' => $assignments,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching nurse patients: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch patients: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get patient details (read-only for diagnoses and doctor orders)
     */
    public function getPatientDetails(int $patientId): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->medical_center_id;

            $patient = Patient::where('id', $patientId)
                ->where('medical_center_id', $branchId)
                ->first();

            if (!$patient) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Patient not found',
                ], 404);
            }

            // Get vital signs history
            $vitalSigns = PatientVitalSign::forPatient($patientId)
                ->forBranch($branchId)
                ->with('nurse:id,name')
                ->orderBy('recorded_at', 'desc')
                ->limit(20)
                ->get();

            return response()->json([
                'status' => 200,
                'data' => [
                    'patient' => $patient,
                    'vitalSigns' => $vitalSigns,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching patient details: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch patient details: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get vital signs history for a patient
     */
    public function getVitalSigns(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->medical_center_id;

            $query = PatientVitalSign::forBranch($branchId)
                ->with(['patient:id,name,registration_number', 'nurse:id,name']);

            // Filter by patient
            if ($request->has('patient_id') && $request->patient_id) {
                $query->forPatient($request->patient_id);
            }

            // Filter by nurse
            if ($request->has('nurse_id') && $request->nurse_id) {
                $query->forNurse($request->nurse_id);
            }

            // Filter by date range
            if ($request->has('start_date') && $request->start_date) {
                $query->whereDate('recorded_at', '>=', $request->start_date);
            }
            if ($request->has('end_date') && $request->end_date) {
                $query->whereDate('recorded_at', '<=', $request->end_date);
            }

            // Filter by abnormal only
            if ($request->get('abnormal_only', false)) {
                $query->where('is_abnormal', true);
            }

            $vitalSigns = $query->orderBy('recorded_at', 'desc')
                ->paginate($request->get('per_page', 20));

            return response()->json([
                'status' => 200,
                'data' => $vitalSigns,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching vital signs: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch vital signs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Record new vital signs
     */
    public function recordVitalSigns(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'patient_id' => 'required|exists:patients,id',
                'temperature' => 'nullable|numeric|min:90|max:110',
                'temperature_unit' => 'nullable|in:C,F',
                'blood_pressure_systolic' => 'nullable|integer|min:40|max:300',
                'blood_pressure_diastolic' => 'nullable|integer|min:20|max:200',
                'pulse_rate' => 'nullable|integer|min:20|max:250',
                'respiration_rate' => 'nullable|integer|min:5|max:60',
                'oxygen_saturation' => 'nullable|integer|min:50|max:100',
                'weight' => 'nullable|numeric|min:0|max:500',
                'height' => 'nullable|numeric|min:0|max:300',
                'pain_level' => 'nullable|integer|min:0|max:10',
                'consciousness_level' => 'nullable|in:Alert,Verbal,Pain,Unresponsive',
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
            $data = $validator->validated();
            $data['nurse_id'] = $user->id;
            $data['branch_id'] = $user->medical_center_id;
            $data['recorded_at'] = Carbon::now();

            // Create vital signs record
            $vitalSign = PatientVitalSign::create($data);

            // Check for abnormalities
            $abnormalities = $vitalSign->checkAbnormalities();
            if (!empty($abnormalities)) {
                $vitalSign->update([
                    'is_abnormal' => true,
                    'abnormal_flags' => $abnormalities,
                ]);
            }

            return response()->json([
                'status' => 201,
                'message' => 'Vital signs recorded successfully',
                'data' => $vitalSign->fresh(['patient:id,name', 'nurse:id,name']),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error recording vital signs: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to record vital signs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update vital signs record
     */
    public function updateVitalSigns(Request $request, int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->medical_center_id;

            $vitalSign = PatientVitalSign::forBranch($branchId)
                ->where('nurse_id', $user->id)
                ->find($id);

            if (!$vitalSign) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Vital signs record not found or not authorized',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'temperature' => 'nullable|numeric|min:90|max:110',
                'temperature_unit' => 'nullable|in:C,F',
                'blood_pressure_systolic' => 'nullable|integer|min:40|max:300',
                'blood_pressure_diastolic' => 'nullable|integer|min:20|max:200',
                'pulse_rate' => 'nullable|integer|min:20|max:250',
                'respiration_rate' => 'nullable|integer|min:5|max:60',
                'oxygen_saturation' => 'nullable|integer|min:50|max:100',
                'weight' => 'nullable|numeric|min:0|max:500',
                'height' => 'nullable|numeric|min:0|max:300',
                'pain_level' => 'nullable|integer|min:0|max:10',
                'consciousness_level' => 'nullable|in:Alert,Verbal,Pain,Unresponsive',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $vitalSign->update($validator->validated());

            // Recheck abnormalities
            $abnormalities = $vitalSign->checkAbnormalities();
            $vitalSign->update([
                'is_abnormal' => !empty($abnormalities),
                'abnormal_flags' => $abnormalities,
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Vital signs updated successfully',
                'data' => $vitalSign->fresh(['patient:id,name', 'nurse:id,name']),
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating vital signs: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update vital signs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get nurse's shift schedule
     */
    public function getShifts(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $nurseId = $user->id;
            $branchId = $user->medical_center_id;

            $query = NurseShiftLog::forNurse($nurseId)
                ->forBranch($branchId);

            // Filter by date range
            $startDate = $request->get('start_date', Carbon::today()->toDateString());
            $endDate = $request->get('end_date', Carbon::today()->addDays(7)->toDateString());
            $query->dateRange($startDate, $endDate);

            $shifts = $query->orderBy('shift_date')
                ->orderBy('scheduled_start')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $shifts,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching shifts: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch shifts: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current shift
     */
    public function getCurrentShift(): JsonResponse
    {
        try {
            $user = Auth::user();
            $nurseId = $user->id;
            $branchId = $user->medical_center_id;

            $shift = NurseShiftLog::forNurse($nurseId)
                ->forBranch($branchId)
                ->today()
                ->first();

            return response()->json([
                'status' => 200,
                'data' => $shift,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching current shift: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch current shift: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Start shift (acknowledgment)
     */
    public function startShift(int $shiftId): JsonResponse
    {
        try {
            $user = Auth::user();
            $nurseId = $user->id;

            $shift = NurseShiftLog::forNurse($nurseId)
                ->where('id', $shiftId)
                ->where('status', NurseShiftLog::STATUS_SCHEDULED)
                ->first();

            if (!$shift) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Shift not found or already started',
                ], 404);
            }

            $shift->start();

            return response()->json([
                'status' => 200,
                'message' => 'Shift started successfully',
                'data' => $shift,
            ]);
        } catch (\Exception $e) {
            Log::error('Error starting shift: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to start shift: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * End shift (acknowledgment)
     */
    public function endShift(int $shiftId): JsonResponse
    {
        try {
            $user = Auth::user();
            $nurseId = $user->id;

            $shift = NurseShiftLog::forNurse($nurseId)
                ->where('id', $shiftId)
                ->where('status', NurseShiftLog::STATUS_STARTED)
                ->first();

            if (!$shift) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Shift not found or not started',
                ], 404);
            }

            $shift->end();

            return response()->json([
                'status' => 200,
                'message' => 'Shift ended successfully',
                'data' => $shift,
            ]);
        } catch (\Exception $e) {
            Log::error('Error ending shift: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to end shift: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get handover notes
     */
    public function getHandovers(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $nurseId = $user->id;
            $branchId = $user->medical_center_id;

            $query = ShiftHandover::forBranch($branchId)
                ->forNurse($nurseId)
                ->with(['fromNurse:id,name', 'toNurse:id,name']);

            // Filter by date range
            if ($request->has('start_date') && $request->start_date) {
                $query->whereDate('handover_date', '>=', $request->start_date);
            }
            if ($request->has('end_date') && $request->end_date) {
                $query->whereDate('handover_date', '<=', $request->end_date);
            }

            // Filter by pending only
            if ($request->get('pending_only', false)) {
                $query->pending()->where('to_nurse_id', $nurseId);
            }

            $handovers = $query->orderBy('handover_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 10));

            return response()->json([
                'status' => 200,
                'data' => $handovers,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching handovers: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch handovers: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create handover notes
     */
    public function createHandover(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'to_nurse_id' => 'required|exists:users,id',
                'ward' => 'required|string|max:100',
                'from_shift' => 'required|in:morning,afternoon,night',
                'to_shift' => 'required|in:morning,afternoon,night',
                'patient_updates' => 'nullable|array',
                'pending_tasks' => 'nullable|array',
                'critical_alerts' => 'nullable|array',
                'general_notes' => 'nullable|string|max:2000',
                'special_observations' => 'nullable|string|max:2000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $data = $validator->validated();
            $data['from_nurse_id'] = $user->id;
            $data['branch_id'] = $user->medical_center_id;
            $data['handover_date'] = Carbon::today();
            $data['is_acknowledged'] = false;

            $handover = ShiftHandover::create($data);

            return response()->json([
                'status' => 201,
                'message' => 'Handover notes created successfully',
                'data' => $handover->fresh(['fromNurse:id,name', 'toNurse:id,name']),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating handover: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create handover: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Acknowledge handover
     */
    public function acknowledgeHandover(int $handoverId): JsonResponse
    {
        try {
            $user = Auth::user();
            $nurseId = $user->id;

            $handover = ShiftHandover::where('to_nurse_id', $nurseId)
                ->where('id', $handoverId)
                ->pending()
                ->first();

            if (!$handover) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Handover not found or already acknowledged',
                ], 404);
            }

            $handover->acknowledge();

            return response()->json([
                'status' => 200,
                'message' => 'Handover acknowledged successfully',
                'data' => $handover,
            ]);
        } catch (\Exception $e) {
            Log::error('Error acknowledging handover: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to acknowledge handover: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get nurse profile
     */
    public function getProfile(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Load additional nurse-specific data
            $user->load('medicalCenter:id,name,address');

            // Get stats
            $stats = [
                'totalVitalSignsRecorded' => PatientVitalSign::forNurse($user->id)->count(),
                'totalShiftsCompleted' => NurseShiftLog::forNurse($user->id)
                    ->where('status', NurseShiftLog::STATUS_COMPLETED)
                    ->count(),
                'totalHandoversCreated' => ShiftHandover::where('from_nurse_id', $user->id)->count(),
            ];

            return response()->json([
                'status' => 200,
                'data' => [
                    'user' => $user,
                    'stats' => $stats,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching profile: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch profile: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update nurse profile (limited: contact details only)
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'phone' => 'nullable|string|max:20',
                'emergency_contact' => 'nullable|string|max:100',
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
                'message' => 'Failed to update profile: ' . $e->getMessage(),
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
                'message' => 'Failed to change password: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available wards
     */
    public function getWards(): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->medical_center_id;

            // Get distinct wards from patient assignments
            $wards = NursePatientAssignment::forBranch($branchId)
                ->distinct()
                ->pluck('ward')
                ->filter()
                ->values();

            // Add default wards if none exist
            if ($wards->isEmpty()) {
                $wards = collect(['General', 'ICU', 'Emergency', 'Pediatric', 'Maternity', 'Surgery']);
            }

            return response()->json([
                'status' => 200,
                'data' => $wards,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching wards: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch wards: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get nurses for handover selection
     */
    public function getNurses(): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->medical_center_id;

            $nurses = User::where('medical_center_id', $branchId)
                ->where('role', 'nurse')
                ->where('is_active', true)
                ->where('id', '!=', $user->id) // Exclude current nurse
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $nurses,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching nurses: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch nurses: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all patients in branch for vital signs recording
     */
    public function getAllPatients(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $branchId = $user->medical_center_id;

            $query = Patient::where('medical_center_id', $branchId)
                ->select('id', 'name', 'registration_number', 'phone', 'gender', 'age', 'blood_type');

            // Search by name or registration number
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('registration_number', 'like', "%{$search}%");
                });
            }

            $patients = $query->orderBy('name')
                ->limit(50)
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $patients,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching patients: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch patients: ' . $e->getMessage(),
            ], 500);
        }
    }
}
