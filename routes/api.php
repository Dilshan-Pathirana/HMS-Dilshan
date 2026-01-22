<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Users\UsersController;
use App\Http\Controllers\Users\PatientController as UsersPatientController;
use App\Http\Controllers\Payment\PayHereWebhookController;
use App\Http\Controllers\PatientAppointment\AppointmentStatusController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\MedicationController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\PharmacyController;
use App\Http\Controllers\Api\PharmacyInventoryController;
use App\Http\Controllers\Api\BranchStaffController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Dashboard\DashboardStatsController;

Route::post('sign-in', [UsersController::class, 'userSignIn']);

// DEBUG: Test auth endpoint (NO MIDDLEWARE)
Route::get('/test-auth', function () {
    $token = request()->bearerToken();
    $tokenParts = explode('|', $token, 2);
    $tokenId = $tokenParts[0] ?? 'none';
    $tokenPlain = $tokenParts[1] ?? 'none';
    
    // Try to find the token using Sanctum's method
    $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
    
    // Also try manual lookup
    $manualToken = null;
    if (is_numeric($tokenId)) {
        $manualToken = \Laravel\Sanctum\PersonalAccessToken::find($tokenId);
        if ($manualToken && hash_equals($manualToken->token, hash('sha256', $tokenPlain))) {
            // Token matches!
        } else {
            $manualToken = null;
        }
    }
    
    return response()->json([
        'bearer_token_received' => $token ? substr($token, 0, 50) . '...' : 'none',
        'token_length' => strlen($token ?? ''),
        'token_id_part' => $tokenId,
        'token_plain_length' => strlen($tokenPlain),
        'sanctum_found' => $accessToken ? true : false,
        'manual_found' => $manualToken ? true : false,
        'user_id' => $accessToken ? $accessToken->tokenable_id : null,
    ]);
});

// DEBUG: Submit feedback without auth middleware for testing
Route::post('/test-submit-feedback', function () {
    $token = request()->bearerToken();
    $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
    
    if (!$accessToken) {
        return response()->json(['status' => 401, 'message' => 'Token not found', 'token_received' => substr($token ?? '', 0, 30)]);
    }
    
    $user = $accessToken->tokenable;
    if (!$user) {
        return response()->json(['status' => 401, 'message' => 'User not found for token']);
    }
    
    // Determine user type based on role_as
    $roleMap = [
        1 => 'super_admin',
        2 => 'doctor',
        3 => 'nurse',
        4 => 'pharmacist',
        5 => 'patient',
        6 => 'cashier',
        7 => 'branch_admin',
    ];
    $userType = request('user_type', $roleMap[$user->role_as] ?? 'staff');
    
    // Manually create feedback
    try {
        $feedback = \App\Models\Feedback::create([
            'user_id' => $user->id,
            'user_type' => $userType,
            'user_name' => $user->first_name . ' ' . $user->last_name,
            'branch_id' => $user->branch_id,
            'category' => request('category', 'general'),
            'subject' => request('subject'),
            'description' => request('description'),
            'experience' => request('experience', 'neutral'),
            'rating' => request('rating', 3),
            'priority' => 'medium',
            'status' => 'pending',
        ]);
        
        return response()->json(['status' => 201, 'message' => 'Feedback created!', 'feedback' => $feedback]);
    } catch (\Exception $e) {
        return response()->json(['status' => 500, 'error' => $e->getMessage()]);
    }
});

// DEBUG: Get my feedbacks without auth middleware
Route::get('/test-my-feedbacks', function () {
    $token = request()->bearerToken();
    $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
    
    if (!$accessToken) {
        return response()->json(['status' => 401, 'message' => 'Token not found']);
    }
    
    $user = $accessToken->tokenable;
    if (!$user) {
        return response()->json(['status' => 401, 'message' => 'User not found']);
    }
    
    $feedbacks = \App\Models\Feedback::where('user_id', $user->id)
        ->orderBy('created_at', 'desc')
        ->get();
    
    return response()->json(['status' => 200, 'feedbacks' => $feedbacks]);
});

// Public signup validation routes (no auth required)
Route::get('/check-credentials-exist', [UsersPatientController::class, 'checkCredentialsExist']);
Route::get('/check-phone-exists/{phone}', [UsersPatientController::class, 'checkPhoneExists']);

// ============================================
// PUBLIC CHATBOT ROUTES (No Auth Required)
// ============================================
use App\Http\Controllers\Api\ChatbotController;

Route::prefix('chatbot')->group(function () {
    Route::post('/chat', [ChatbotController::class, 'chat']);
    Route::post('/feedback', [ChatbotController::class, 'feedback']);
    Route::get('/suggestions', [ChatbotController::class, 'getSuggestions']);
});

// Patient details route (for patient dashboard)
Route::get('/get-patient-details/{user_id}', [UsersPatientController::class, 'getPatientDetailsByUserID']);

// Profile Management Routes (Protected)
Route::middleware(['auth:sanctum'])->group(function () {
    // Session validation endpoint
    Route::get('/validate-session', function () {
        return response()->json(['valid' => true, 'user_id' => auth()->id()]);
    });
    
    // Generic feedback submission (for all authenticated users)
    Route::post('/submit-feedback', [\App\Http\Controllers\BranchAdmin\BranchAdminFeedbackController::class, 'store']);
    Route::get('/my-feedbacks', [\App\Http\Controllers\BranchAdmin\BranchAdminFeedbackController::class, 'getMyFeedbacks']);
    
    Route::post('/upload-profile-picture/{userId}', [ProfileController::class, 'uploadProfilePicture']);
    Route::delete('/remove-profile-picture/{userId}', [ProfileController::class, 'removeProfilePicture']);
    Route::put('/change-password/{userId}', [ProfileController::class, 'changePassword']);
    Route::put('/update-contact-info/{userId}', [ProfileController::class, 'updateContactInfo']);
    
    // Dashboard Statistics Routes
    Route::get('/super-admin/dashboard-stats', [DashboardStatsController::class, 'getSuperAdminStats']);
    Route::get('/doctor/dashboard-stats', [DashboardStatsController::class, 'getDoctorStats']);
    Route::get('/pharmacist/dashboard-stats', [DashboardStatsController::class, 'getPharmacistStats']);
    Route::get('/cashier/dashboard-stats', [DashboardStatsController::class, 'getCashierStats']);
    Route::get('/patient/dashboard-stats', [DashboardStatsController::class, 'getPatientStats']);
    Route::get('/supplier/dashboard-stats', [DashboardStatsController::class, 'getSupplierStats']);
    
    // Staff Dashboard Statistics Routes
    Route::get('/receptionist/dashboard-stats', [DashboardStatsController::class, 'getReceptionistStats']);
    Route::get('/nurse/dashboard-stats', [DashboardStatsController::class, 'getNurseStats']);
    Route::get('/it-assistant/dashboard-stats', [DashboardStatsController::class, 'getITAssistantStats']);
    Route::get('/clerk/dashboard-stats', [DashboardStatsController::class, 'getClerkStats']);
    Route::get('/director/dashboard-stats', [DashboardStatsController::class, 'getDirectorStats']);
    Route::get('/secretary/dashboard-stats', [DashboardStatsController::class, 'getSecretaryStats']);
    Route::get('/paramedic/dashboard-stats', [DashboardStatsController::class, 'getParamedicStats']);
    Route::get('/audiologist/dashboard-stats', [DashboardStatsController::class, 'getAudiologistStats']);
    Route::get('/medical-assistant/dashboard-stats', [DashboardStatsController::class, 'getMedicalAssistantStats']);
    Route::get('/branch-admin/dashboard-stats', [DashboardStatsController::class, 'getBranchAdminStats']);
});

Route::post('payments/payhere/webhook', [PayHereWebhookController::class, 'handleNotification']);
Route::post('appointments/status', [AppointmentStatusController::class, 'checkByOrderId']);

// New Clean Architecture API Routes
Route::middleware(['auth:sanctum', 'check.center', 'audit', 'throttle:60,1'])->prefix('v1')->group(function () {
    
    // Patient Management
    Route::middleware('role:doctor,receptionist,nurse')->group(function () {
        Route::apiResource('patients', PatientController::class);
        Route::get('patients/search/registration', [PatientController::class, 'searchByRegistration']);
    });
    
    // Appointment Management
    Route::middleware('role:doctor,receptionist,patient')->group(function () {
        Route::apiResource('appointments', AppointmentController::class);
        Route::post('appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::get('appointments/today/schedule', [AppointmentController::class, 'todaySchedule']);
        Route::get('appointments/patient/{patientId}', [AppointmentController::class, 'patientAppointments']);
    });
    
    // Session Management
    Route::middleware('role:doctor,nurse')->group(function () {
        Route::apiResource('sessions', SessionController::class);
        Route::post('sessions/{sessionId}/prescriptions', [SessionController::class, 'addPrescription']);
        Route::get('sessions/ongoing/list', [SessionController::class, 'ongoing']);
        Route::get('sessions/patient/{patientId}/history', [SessionController::class, 'patientHistory']);
    });
    
    // Medication/Pharmacy Management
    Route::middleware('role:pharmacist,doctor')->group(function () {
        Route::apiResource('medications', MedicationController::class);
        Route::get('medications/alerts/low-stock', [MedicationController::class, 'lowStock']);
        Route::get('medications/alerts/expiring-soon', [MedicationController::class, 'expiringSoon']);
        Route::patch('medications/{id}/stock', [MedicationController::class, 'updateStock']);
        Route::get('medications/inventory/value', [MedicationController::class, 'inventoryValue']);
    });
    
    // Billing Management
    Route::middleware('role:cashier,receptionist')->group(function () {
        Route::get('billing/invoices', [BillingController::class, 'invoices']);
        Route::post('billing/invoices', [BillingController::class, 'createInvoice']);
        Route::get('billing/invoices/{id}', [BillingController::class, 'showInvoice']);
        Route::post('billing/payments', [BillingController::class, 'recordPayment']);
        Route::get('billing/payments', [BillingController::class, 'payments']);
        Route::get('billing/reports/revenue', [BillingController::class, 'revenueReport']);
    });
    
    // Payroll & Attendance Management
    Route::middleware('role:tenant_admin,center_admin')->group(function () {
        Route::apiResource('payroll', PayrollController::class)->only(['index', 'show']);
        Route::post('payroll/generate', [PayrollController::class, 'generate']);
        Route::post('payroll/{id}/disburse', [PayrollController::class, 'disburse']);
        Route::get('payroll/employee/{employeeId}/summary', [PayrollController::class, 'employeeSummary']);
        Route::get('payroll/reports/total-cost', [PayrollController::class, 'totalCost']);
    });
    
    // Attendance (all employees)
    Route::get('attendance', [PayrollController::class, 'attendance']);
    Route::post('attendance/check-in', [PayrollController::class, 'checkIn']);
    Route::post('attendance/check-out', [PayrollController::class, 'checkOut']);
});

// Branch Management Routes (without check.center middleware since we're managing centers themselves)
Route::middleware(['auth:sanctum', 'audit', 'throttle:60,1'])->prefix('v1')->group(function () {
    
    // Branch Management (Super Admin & Branch Admin)
    Route::prefix('branches')->group(function () {
        Route::get('/', [BranchController::class, 'index']);
        Route::get('/{id}', [BranchController::class, 'show']);
        Route::get('/{id}/staff', [BranchController::class, 'staff']);
        Route::post('/', [BranchController::class, 'store']);
        Route::put('/{id}', [BranchController::class, 'update']);
        Route::delete('/{id}', [BranchController::class, 'destroy']);
    });
    
    // Pharmacy Management
    Route::prefix('pharmacies')->group(function () {
        Route::get('/', [PharmacyController::class, 'index']);
        Route::post('/check-conflict', [PharmacyController::class, 'checkConflict']);
        Route::get('/{id}', [PharmacyController::class, 'show']);
        Route::get('/{id}/inventory', [PharmacyController::class, 'inventory']);
        Route::get('/{id}/low-stock', [PharmacyController::class, 'lowStock']);
        Route::get('/{id}/expiring', [PharmacyController::class, 'expiring']);
        Route::post('/', [PharmacyController::class, 'store']);
        Route::put('/{id}', [PharmacyController::class, 'update']);
        Route::delete('/{id}', [PharmacyController::class, 'destroy']);
    });
    
    // Pharmacy Inventory Management
    Route::prefix('pharmacy-inventory')->group(function () {
        Route::get('/', [PharmacyInventoryController::class, 'index']);
        Route::get('/transactions', [PharmacyInventoryController::class, 'transactions']);
        Route::get('/{id}', [PharmacyInventoryController::class, 'show']);
        Route::post('/', [PharmacyInventoryController::class, 'store']);
        Route::put('/{id}', [PharmacyInventoryController::class, 'update']);
        Route::post('/{id}/adjust-stock', [PharmacyInventoryController::class, 'adjustStock']);
        Route::post('/transfer', [PharmacyInventoryController::class, 'transfer']);
        Route::delete('/{id}', [PharmacyInventoryController::class, 'destroy']);
    });
    
    // Branch Staff Management
    Route::prefix('branch-staff')->group(function () {
        Route::get('/', [BranchStaffController::class, 'index']);
        Route::post('/', [BranchStaffController::class, 'store']);
        Route::put('/{id}', [BranchStaffController::class, 'update']);
        Route::delete('/{id}', [BranchStaffController::class, 'destroy']);
    });
    
    // User Branch Assignments
    Route::get('users/{userId}/branch-assignments', [BranchStaffController::class, 'userAssignments']);
});

require __DIR__.'/superAdminRoutes.php';
require __DIR__.'/branchAdminRoutes.php';
require __DIR__.'/pharmacistRoutes.php';
require __DIR__.'/cashierRoutes.php';
require __DIR__.'/nurseRoutes.php';
require __DIR__.'/receptionistRoutes.php';
require __DIR__.'/webRoutes.php';
require __DIR__.'/patientRoutes.php';
require __DIR__.'/doctorAppointmentsRoute.php';
require __DIR__.'/supplierRoutes.php';
require __DIR__.'/appointmentRoutes.php';
require __DIR__.'/medicalInsightsRoutes.php';
require __DIR__.'/hrmRoutes.php';
