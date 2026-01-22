<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DoctorConsultationController extends Controller
{
    /**
     * Validate the auth token and return user
     * Since routes use auth:sanctum middleware, we can use $request->user()
     */
    private function validateToken(Request $request)
    {
        // First try Sanctum auth (preferred method when going through middleware)
        $user = $request->user();
        if ($user) {
            return $user;
        }
        
        // Fallback: manual token validation
        $token = $request->bearerToken();
        if (!$token) {
            Log::warning('No bearer token found in request');
            return null;
        }

        // Sanctum tokens are stored as "id|token" - we need to extract the token part
        $tokenParts = explode('|', $token);
        $tokenToHash = count($tokenParts) === 2 ? $tokenParts[1] : $token;
        
        $tokenRecord = DB::table('personal_access_tokens')
            ->where('token', hash('sha256', $tokenToHash))
            ->first();

        if (!$tokenRecord) {
            Log::warning('Token not found in database', ['token_prefix' => substr($token, 0, 20)]);
            return null;
        }

        return DB::table('users')->where('id', $tokenRecord->tokenable_id)->first();
    }

    /**
     * Log consultation audit
     */
    private function logAudit($consultationId, $userId, $userRole, $action, $details = null, $oldValues = null, $newValues = null)
    {
        DB::table('consultation_audit_logs')->insert([
            'id' => Str::uuid()->toString(),
            'consultation_id' => $consultationId,
            'user_id' => $userId,
            'user_role' => $userRole,
            'action' => $action,
            'details' => $details,
            'old_values' => $oldValues ? json_encode($oldValues) : null,
            'new_values' => $newValues ? json_encode($newValues) : null,
            'ip_address' => request()->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Get today's patient queue for the doctor
     */
    public function getTodayQueue(Request $request, $doctorId)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $today = now()->format('Y-m-d');
            
            // Get driver for SQL compatibility
            $driver = DB::connection()->getDriverName();
            $concat = $driver === 'sqlite'
                ? "(p.first_name || ' ' || p.last_name)"
                : "CONCAT(p.first_name, ' ', p.last_name)";

            $queue = DB::table('appointment_bookings as ab')
                ->select([
                    'ab.id',
                    'ab.patient_id',
                    'ab.appointment_date',
                    'ab.appointment_time',
                    'ab.slot_number',
                    'ab.token_number',
                    'ab.status',
                    'ab.payment_status',
                    'ab.notes',
                    DB::raw("$concat as patient_name"),
                    'p.phone as patient_phone',
                    'p.gender as patient_gender',
                    'p.date_of_birth as patient_dob',
                    'c.id as consultation_id',
                    'c.status as consultation_status',
                ])
                ->join('patients as p', 'ab.patient_id', '=', 'p.id')
                ->leftJoin('consultations as c', function($join) {
                    $join->on('ab.id', '=', 'c.appointment_id');
                })
                ->where('ab.doctor_id', $doctorId)
                ->where('ab.appointment_date', $today)
                ->whereIn('ab.status', ['confirmed', 'checked_in', 'in_session', 'pending_payment'])
                ->orderBy('ab.token_number')
                ->orderBy('ab.appointment_time')
                ->get();

            // Add calculated fields
            $queue = $queue->map(function($item) {
                $item->age = null;
                if ($item->patient_dob) {
                    $item->age = now()->diffInYears($item->patient_dob);
                }
                
                // Determine display status
                if ($item->consultation_id && $item->consultation_status === 'in_progress') {
                    $item->display_status = 'In Consultation';
                } elseif ($item->consultation_id && in_array($item->consultation_status, ['completed', 'payment_pending', 'paid', 'medicines_issued'])) {
                    $item->display_status = 'Completed';
                } elseif ($item->status === 'checked_in') {
                    $item->display_status = 'Checked In';
                } else {
                    $item->display_status = 'Waiting';
                }
                
                return $item;
            });

            return response()->json([
                'status' => 200,
                'queue' => $queue,
                'date' => $today,
                'total' => $queue->count(),
                'waiting' => $queue->where('display_status', 'Waiting')->count(),
                'in_consultation' => $queue->where('display_status', 'In Consultation')->count(),
                'completed' => $queue->where('display_status', 'Completed')->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Get today queue error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch queue',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get appointments for a specific date
     */
    public function getAppointmentsByDate(Request $request, $doctorId, $date)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $driver = DB::connection()->getDriverName();
            $concat = $driver === 'sqlite'
                ? "(p.first_name || ' ' || p.last_name)"
                : "CONCAT(p.first_name, ' ', p.last_name)";

            $appointments = DB::table('appointment_bookings as ab')
                ->select([
                    'ab.id',
                    'ab.patient_id',
                    'ab.appointment_date',
                    'ab.appointment_time',
                    'ab.slot_number',
                    'ab.token_number',
                    'ab.status',
                    'ab.payment_status',
                    'ab.notes',
                    DB::raw("$concat as patient_name"),
                    'p.phone as patient_phone',
                    'p.gender as patient_gender',
                    'p.date_of_birth as patient_dob',
                ])
                ->join('patients as p', 'ab.patient_id', '=', 'p.id')
                ->where('ab.doctor_id', $doctorId)
                ->where('ab.appointment_date', $date)
                ->whereIn('ab.status', ['confirmed', 'checked_in', 'pending_payment'])
                ->orderBy('ab.token_number')
                ->orderBy('ab.appointment_time')
                ->get();

            return response()->json([
                'status' => 200,
                'appointments' => $appointments,
                'date' => $date,
                'total' => $appointments->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Get appointments by date error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch appointments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get patient overview (read-only profile, history, allergies)
     */
    public function getPatientOverview(Request $request, $patientId)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            // Get patient basic info
            $patient = DB::table('patients')
                ->where('id', $patientId)
                ->first();

            if (!$patient) {
                return response()->json(['status' => 404, 'message' => 'Patient not found'], 404);
            }

            // Get past consultations
            $pastConsultations = DB::table('consultations as c')
                ->select([
                    'c.id',
                    'c.started_at',
                    'c.chief_complaint',
                    'c.clinical_notes',
                    'c.follow_up_instructions',
                    'c.consultation_fee',
                    'c.status',
                    'u.first_name as doctor_first_name',
                    'u.last_name as doctor_last_name',
                ])
                ->leftJoin('users as u', 'c.doctor_id', '=', 'u.id')
                ->where('c.patient_id', $patientId)
                ->where('c.status', '!=', 'in_progress')
                ->orderBy('c.started_at', 'desc')
                ->limit(10)
                ->get();

            // Get diagnoses for each consultation
            foreach ($pastConsultations as $consultation) {
                $consultation->diagnoses = DB::table('consultation_diagnoses as cd')
                    ->select('dm.diagnosis_name', 'cd.diagnosis_type')
                    ->join('diagnosis_master as dm', 'cd.diagnosis_id', '=', 'dm.id')
                    ->where('cd.consultation_id', $consultation->id)
                    ->get();

                $consultation->prescriptions = DB::table('consultation_prescriptions')
                    ->select('medicine_name', 'potency', 'dosage', 'frequency', 'duration', 'instructions')
                    ->where('consultation_id', $consultation->id)
                    ->get();
            }

            // Get all diagnoses for this patient
            $allDiagnoses = DB::table('consultation_diagnoses as cd')
                ->select('dm.diagnosis_name', 'cd.diagnosis_type', 'cd.created_at')
                ->join('diagnosis_master as dm', 'cd.diagnosis_id', '=', 'dm.id')
                ->join('consultations as c', 'cd.consultation_id', '=', 'c.id')
                ->where('c.patient_id', $patientId)
                ->orderBy('cd.created_at', 'desc')
                ->get();

            // Get medication history
            $medicationHistory = DB::table('consultation_prescriptions as cp')
                ->select('cp.medicine_name', 'cp.potency', 'cp.dosage', 'cp.frequency', 'cp.duration', 'c.started_at')
                ->join('consultations as c', 'cp.consultation_id', '=', 'c.id')
                ->where('c.patient_id', $patientId)
                ->orderBy('c.started_at', 'desc')
                ->limit(20)
                ->get();

            return response()->json([
                'status' => 200,
                'patient' => [
                    'id' => $patient->id,
                    'first_name' => $patient->first_name,
                    'last_name' => $patient->last_name,
                    'phone' => $patient->phone,
                    'email' => $patient->email ?? null,
                    'date_of_birth' => $patient->date_of_birth ?? null,
                    'age' => $patient->date_of_birth ? now()->diffInYears($patient->date_of_birth) : null,
                    'gender' => $patient->gender ?? null,
                    'blood_type' => $patient->blood_type ?? null,
                    'allergies' => $patient->allergies ?? null,
                    'medical_conditions' => $patient->medical_conditions ?? null,
                    'emergency_contact' => $patient->emergency_contact ?? null,
                    'address' => $patient->address ?? null,
                ],
                'past_consultations' => $pastConsultations,
                'all_diagnoses' => $allDiagnoses,
                'medication_history' => $medicationHistory,
            ]);
        } catch (\Exception $e) {
            Log::error('Get patient overview error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch patient overview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start a new consultation session
     */
    public function startConsultation(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $appointmentId = $request->input('appointment_id');
            
            // Check if appointment exists and is valid
            $appointment = DB::table('appointment_bookings')
                ->where('id', $appointmentId)
                ->first();

            if (!$appointment) {
                return response()->json(['status' => 404, 'message' => 'Appointment not found'], 404);
            }

            // Check if consultation already exists
            $existingConsultation = DB::table('consultations')
                ->where('appointment_id', $appointmentId)
                ->first();

            if ($existingConsultation && $existingConsultation->status === 'in_progress') {
                return response()->json([
                    'status' => 200,
                    'message' => 'Consultation already in progress',
                    'consultation_id' => $existingConsultation->id,
                ]);
            }

            if ($existingConsultation && $existingConsultation->status !== 'in_progress') {
                return response()->json([
                    'status' => 400,
                    'message' => 'This appointment already has a completed consultation'
                ], 400);
            }

            // Create new consultation
            $consultationId = Str::uuid()->toString();
            
            DB::beginTransaction();

            DB::table('consultations')->insert([
                'id' => $consultationId,
                'appointment_id' => $appointmentId,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $appointment->doctor_id,
                'branch_id' => $appointment->branch_id,
                'started_at' => now(),
                'status' => 'in_progress',
                'payment_status' => 'pending',
                'medicine_status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update appointment status
            DB::table('appointment_bookings')
                ->where('id', $appointmentId)
                ->update([
                    'status' => 'in_session',
                    'session_started_at' => now(),
                    'updated_at' => now(),
                ]);

            // Log audit
            $this->logAudit($consultationId, $user->id, 'doctor', 'consultation_started', 'Doctor started consultation');

            DB::commit();

            return response()->json([
                'status' => 201,
                'message' => 'Consultation started successfully',
                'consultation_id' => $consultationId,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Start consultation error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to start consultation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get question bank for clinical questioning
     */
    public function getQuestionBank(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $category = $request->query('category');

            $query = DB::table('consultation_question_bank')
                ->where('is_active', true)
                ->orderBy('category')
                ->orderBy('sort_order');

            if ($category) {
                $query->where('category', $category);
            }

            $questions = $query->get();

            // Group by category
            $grouped = $questions->groupBy('category');

            return response()->json([
                'status' => 200,
                'questions' => $questions,
                'grouped' => $grouped,
                'categories' => [
                    'general_symptoms' => 'General Symptoms',
                    'mental_state' => 'Mental State',
                    'physical_symptoms' => 'Physical Symptoms',
                    'modalities' => 'Modalities (Aggravations/Ameliorations)',
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get question bank error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch question bank',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save consultation questions and answers
     */
    public function saveQuestions(Request $request, $consultationId)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $questions = $request->input('questions', []);

            DB::beginTransaction();

            // Delete existing questions for this consultation
            DB::table('consultation_questions')
                ->where('consultation_id', $consultationId)
                ->delete();

            // Insert new questions
            foreach ($questions as $index => $q) {
                DB::table('consultation_questions')->insert([
                    'id' => Str::uuid()->toString(),
                    'consultation_id' => $consultationId,
                    'question_bank_id' => $q['question_bank_id'] ?? null,
                    'question_text' => $q['question_text'],
                    'category' => $q['category'] ?? null,
                    'answer_type' => $q['answer_type'] ?? 'text',
                    'answer_text' => $q['answer_text'] ?? null,
                    'answer_scale' => $q['answer_scale'] ?? null,
                    'answer_boolean' => $q['answer_boolean'] ?? null,
                    'answer_multiple' => isset($q['answer_multiple']) ? json_encode($q['answer_multiple']) : null,
                    'sort_order' => $index,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 200,
                'message' => 'Questions saved successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Save questions error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to save questions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get diagnosis master list
     */
    public function getDiagnoses(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $search = $request->query('search');
            $category = $request->query('category');

            $query = DB::table('diagnosis_master')
                ->where('is_active', true)
                ->orderBy('diagnosis_name');

            if ($search) {
                $query->where('diagnosis_name', 'like', "%{$search}%");
            }

            if ($category) {
                $query->where('category', $category);
            }

            $diagnoses = $query->get();

            return response()->json([
                'status' => 200,
                'diagnoses' => $diagnoses,
            ]);
        } catch (\Exception $e) {
            Log::error('Get diagnoses error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch diagnoses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add new diagnosis to master table
     */
    public function addDiagnosis(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $diagnosisName = $request->input('diagnosis_name');
            $description = $request->input('description');
            $category = $request->input('category', 'acute');

            // Check if already exists
            $existing = DB::table('diagnosis_master')
                ->where('diagnosis_name', $diagnosisName)
                ->first();

            if ($existing) {
                return response()->json([
                    'status' => 200,
                    'message' => 'Diagnosis already exists',
                    'diagnosis' => $existing,
                ]);
            }

            $diagnosisId = Str::uuid()->toString();

            DB::table('diagnosis_master')->insert([
                'id' => $diagnosisId,
                'diagnosis_name' => $diagnosisName,
                'description' => $description,
                'category' => $category,
                'is_active' => true,
                'created_by' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $diagnosis = DB::table('diagnosis_master')->where('id', $diagnosisId)->first();

            return response()->json([
                'status' => 201,
                'message' => 'Diagnosis added successfully',
                'diagnosis' => $diagnosis,
            ]);
        } catch (\Exception $e) {
            Log::error('Add diagnosis error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to add diagnosis',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save consultation diagnoses
     */
    public function saveDiagnoses(Request $request, $consultationId)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $diagnoses = $request->input('diagnoses', []);

            DB::beginTransaction();

            // Delete existing diagnoses for this consultation
            DB::table('consultation_diagnoses')
                ->where('consultation_id', $consultationId)
                ->delete();

            // Insert new diagnoses
            foreach ($diagnoses as $index => $d) {
                DB::table('consultation_diagnoses')->insert([
                    'id' => Str::uuid()->toString(),
                    'consultation_id' => $consultationId,
                    'diagnosis_id' => $d['diagnosis_id'],
                    'diagnosis_type' => $d['diagnosis_type'] ?? 'provisional',
                    'notes' => $d['notes'] ?? null,
                    'sort_order' => $index,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 200,
                'message' => 'Diagnoses saved successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Save diagnoses error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to save diagnoses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available medicines from inventory (read-only)
     */
    public function getMedicines(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $search = $request->query('search');
            $branchId = $request->query('branch_id');

            // Get from products table
            $query = DB::table('products')
                ->select([
                    'products.id',
                    'products.product_name',
                    'products.category',
                    'products.unit_price',
                    'products.description',
                ])
                ->where('products.status', 'active');

            if ($search) {
                $query->where('products.product_name', 'like', "%{$search}%");
            }

            $medicines = $query->orderBy('products.product_name')->limit(50)->get();

            return response()->json([
                'status' => 200,
                'medicines' => $medicines,
            ]);
        } catch (\Exception $e) {
            Log::error('Get medicines error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch medicines',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save consultation prescriptions
     */
    public function savePrescriptions(Request $request, $consultationId)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $prescriptions = $request->input('prescriptions', []);

            DB::beginTransaction();

            // Delete existing prescriptions for this consultation
            DB::table('consultation_prescriptions')
                ->where('consultation_id', $consultationId)
                ->delete();

            // Insert new prescriptions
            foreach ($prescriptions as $index => $p) {
                DB::table('consultation_prescriptions')->insert([
                    'id' => Str::uuid()->toString(),
                    'consultation_id' => $consultationId,
                    'product_id' => $p['product_id'] ?? null,
                    'medicine_name' => $p['medicine_name'],
                    'potency' => $p['potency'] ?? null,
                    'dosage' => $p['dosage'],
                    'frequency' => $p['frequency'],
                    'duration' => $p['duration'],
                    'instructions' => $p['instructions'] ?? null,
                    'quantity' => $p['quantity'] ?? null,
                    'unit_price' => $p['unit_price'] ?? 0,
                    'total_price' => ($p['unit_price'] ?? 0) * ($p['quantity'] ?? 1),
                    'dispensing_status' => 'pending',
                    'sort_order' => $index,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 200,
                'message' => 'Prescriptions saved successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Save prescriptions error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to save prescriptions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit consultation (complete and send to billing)
     */
    public function submitConsultation(Request $request, $consultationId)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $consultationFee = $request->input('consultation_fee', 0);
            $isFree = $request->input('is_free', false);
            $clinicalNotes = $request->input('clinical_notes');
            $chiefComplaint = $request->input('chief_complaint');
            $examinationFindings = $request->input('examination_findings');
            $followUpInstructions = $request->input('follow_up_instructions');
            $followUpDate = $request->input('follow_up_date');

            // Generate billing reference
            $billingReferenceId = 'CON-' . strtoupper(Str::random(8));

            DB::beginTransaction();

            // Update consultation
            DB::table('consultations')
                ->where('id', $consultationId)
                ->update([
                    'consultation_fee' => $consultationFee,
                    'is_free' => $isFree,
                    'clinical_notes' => $clinicalNotes,
                    'chief_complaint' => $chiefComplaint,
                    'examination_findings' => $examinationFindings,
                    'follow_up_instructions' => $followUpInstructions,
                    'follow_up_date' => $followUpDate,
                    'status' => $isFree ? 'completed' : 'payment_pending',
                    'payment_status' => $isFree ? 'waived' : 'pending',
                    'billing_reference_id' => $billingReferenceId,
                    'submitted_by' => $user->id,
                    'submitted_at' => now(),
                    'ended_at' => now(),
                    'updated_at' => now(),
                ]);

            // Get consultation to update appointment
            $consultation = DB::table('consultations')->where('id', $consultationId)->first();

            // Update appointment status
            DB::table('appointment_bookings')
                ->where('id', $consultation->appointment_id)
                ->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'updated_at' => now(),
                ]);

            // Log audit
            $this->logAudit($consultationId, $user->id, 'doctor', 'consultation_submitted', 
                "Consultation submitted with fee: {$consultationFee}", null, [
                'consultation_fee' => $consultationFee,
                'is_free' => $isFree,
                'billing_reference_id' => $billingReferenceId,
            ]);

            DB::commit();

            return response()->json([
                'status' => 200,
                'message' => 'Consultation submitted successfully',
                'billing_reference_id' => $billingReferenceId,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Submit consultation error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to submit consultation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get consultation details
     */
    public function getConsultation(Request $request, $consultationId)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $consultation = DB::table('consultations')
                ->where('id', $consultationId)
                ->first();

            if (!$consultation) {
                return response()->json(['status' => 404, 'message' => 'Consultation not found'], 404);
            }

            // Get questions
            $questions = DB::table('consultation_questions')
                ->where('consultation_id', $consultationId)
                ->orderBy('sort_order')
                ->get();

            // Get diagnoses
            $diagnoses = DB::table('consultation_diagnoses as cd')
                ->select('cd.*', 'dm.diagnosis_name', 'dm.description', 'dm.category')
                ->join('diagnosis_master as dm', 'cd.diagnosis_id', '=', 'dm.id')
                ->where('cd.consultation_id', $consultationId)
                ->orderBy('cd.sort_order')
                ->get();

            // Get prescriptions
            $prescriptions = DB::table('consultation_prescriptions')
                ->where('consultation_id', $consultationId)
                ->orderBy('sort_order')
                ->get();

            return response()->json([
                'status' => 200,
                'consultation' => $consultation,
                'questions' => $questions,
                'diagnoses' => $diagnoses,
                'prescriptions' => $prescriptions,
            ]);
        } catch (\Exception $e) {
            Log::error('Get consultation error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch consultation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending consultations for cashier (payment pending)
     */
    public function getPendingForCashier(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $branchId = $request->query('branch_id');

            $driver = DB::connection()->getDriverName();
            $concatPatient = $driver === 'sqlite'
                ? "(p.first_name || ' ' || p.last_name)"
                : "CONCAT(p.first_name, ' ', p.last_name)";
            $concatDoctor = $driver === 'sqlite'
                ? "(d.first_name || ' ' || d.last_name)"
                : "CONCAT(d.first_name, ' ', d.last_name)";

            $query = DB::table('consultations as c')
                ->select([
                    'c.id',
                    'c.billing_reference_id',
                    'c.consultation_fee',
                    'c.started_at',
                    'c.submitted_at',
                    'c.status',
                    'c.payment_status',
                    DB::raw("$concatPatient as patient_name"),
                    'p.phone as patient_phone',
                    DB::raw("$concatDoctor as doctor_name"),
                ])
                ->join('patients as p', 'c.patient_id', '=', 'p.id')
                ->join('users as d', 'c.doctor_id', '=', 'd.id')
                ->where('c.status', 'payment_pending')
                ->where('c.payment_status', 'pending');

            if ($branchId) {
                $query->where('c.branch_id', $branchId);
            }

            $consultations = $query->orderBy('c.submitted_at', 'desc')->get();

            // Get prescriptions for each consultation
            foreach ($consultations as $consultation) {
                $consultation->prescriptions = DB::table('consultation_prescriptions')
                    ->select('medicine_name', 'potency', 'dosage', 'quantity', 'unit_price', 'total_price')
                    ->where('consultation_id', $consultation->id)
                    ->get();
                
                $consultation->medicine_total = $consultation->prescriptions->sum('total_price');
                $consultation->grand_total = $consultation->consultation_fee + $consultation->medicine_total;
            }

            return response()->json([
                'status' => 200,
                'consultations' => $consultations,
            ]);
        } catch (\Exception $e) {
            Log::error('Get pending for cashier error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch pending consultations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process payment for consultation (cashier action)
     */
    public function processPayment(Request $request, $consultationId)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $paymentMethod = $request->input('payment_method');
            $amountPaid = $request->input('amount_paid');

            DB::beginTransaction();

            DB::table('consultations')
                ->where('id', $consultationId)
                ->update([
                    'status' => 'paid',
                    'payment_status' => 'paid',
                    'updated_at' => now(),
                ]);

            // Log audit
            $this->logAudit($consultationId, $user->id, 'cashier', 'payment_collected', 
                "Payment collected: {$amountPaid} via {$paymentMethod}");

            DB::commit();

            return response()->json([
                'status' => 200,
                'message' => 'Payment processed successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Process payment error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to process payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get paid consultations for pharmacist (medicine dispensing)
     */
    public function getPendingForPharmacist(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $branchId = $request->query('branch_id');

            $driver = DB::connection()->getDriverName();
            $concatPatient = $driver === 'sqlite'
                ? "(p.first_name || ' ' || p.last_name)"
                : "CONCAT(p.first_name, ' ', p.last_name)";
            $concatDoctor = $driver === 'sqlite'
                ? "(d.first_name || ' ' || d.last_name)"
                : "CONCAT(d.first_name, ' ', d.last_name)";

            $query = DB::table('consultations as c')
                ->select([
                    'c.id',
                    'c.billing_reference_id',
                    'c.submitted_at',
                    'c.status',
                    'c.medicine_status',
                    DB::raw("$concatPatient as patient_name"),
                    'p.phone as patient_phone',
                    DB::raw("$concatDoctor as doctor_name"),
                ])
                ->join('patients as p', 'c.patient_id', '=', 'p.id')
                ->join('users as d', 'c.doctor_id', '=', 'd.id')
                ->whereIn('c.payment_status', ['paid', 'waived'])
                ->where('c.medicine_status', 'pending');

            if ($branchId) {
                $query->where('c.branch_id', $branchId);
            }

            $consultations = $query->orderBy('c.submitted_at', 'desc')->get();

            // Get prescriptions for each consultation
            foreach ($consultations as $consultation) {
                $consultation->prescriptions = DB::table('consultation_prescriptions')
                    ->where('consultation_id', $consultation->id)
                    ->get();
            }

            return response()->json([
                'status' => 200,
                'consultations' => $consultations,
            ]);
        } catch (\Exception $e) {
            Log::error('Get pending for pharmacist error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch pending consultations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Issue medicines (pharmacist action)
     */
    public function issueMedicines(Request $request, $consultationId)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $dispensedItems = $request->input('dispensed_items', []);

            DB::beginTransaction();

            foreach ($dispensedItems as $item) {
                DB::table('consultation_prescriptions')
                    ->where('id', $item['prescription_id'])
                    ->update([
                        'dispensing_status' => $item['status'] ?? 'issued',
                        'dispensed_by' => $user->id,
                        'dispensed_at' => now(),
                        'batch_id' => $item['batch_id'] ?? null,
                        'quantity_dispensed' => $item['quantity_dispensed'] ?? null,
                        'updated_at' => now(),
                    ]);
            }

            // Check if all medicines are issued
            $pendingCount = DB::table('consultation_prescriptions')
                ->where('consultation_id', $consultationId)
                ->where('dispensing_status', 'pending')
                ->count();

            $medicineStatus = $pendingCount === 0 ? 'issued' : 'partial';

            DB::table('consultations')
                ->where('id', $consultationId)
                ->update([
                    'medicine_status' => $medicineStatus,
                    'status' => $medicineStatus === 'issued' ? 'medicines_issued' : 'paid',
                    'updated_at' => now(),
                ]);

            // Log audit
            $this->logAudit($consultationId, $user->id, 'pharmacist', 'medicines_issued', 
                "Medicines issued: " . count($dispensedItems) . " items");

            DB::commit();

            return response()->json([
                'status' => 200,
                'message' => 'Medicines issued successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Issue medicines error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to issue medicines',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get consultation audit log
     */
    public function getAuditLog(Request $request, $consultationId)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }

            $driver = DB::connection()->getDriverName();
            $concat = $driver === 'sqlite'
                ? "(u.first_name || ' ' || u.last_name)"
                : "CONCAT(u.first_name, ' ', u.last_name)";

            $logs = DB::table('consultation_audit_logs as cal')
                ->select([
                    'cal.*',
                    DB::raw("$concat as user_name"),
                ])
                ->leftJoin('users as u', 'cal.user_id', '=', 'u.id')
                ->where('cal.consultation_id', $consultationId)
                ->orderBy('cal.created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 200,
                'audit_logs' => $logs,
            ]);
        } catch (\Exception $e) {
            Log::error('Get audit log error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch audit log',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
