<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Users\NurseController;
use App\Http\Controllers\Users\UsersController;
use App\Http\Controllers\Users\DoctorController;
use App\Http\Controllers\Users\AllUserController;
use App\Http\Controllers\Users\CashierController;
use App\Http\Controllers\Users\PatientController;
use App\Http\Controllers\Users\StaffController;
use App\Http\Controllers\Users\UserResignationController;
use App\Http\Middleware\SuperAdminCheckMiddleware;
use App\Http\Controllers\StaffSalary\StaffSalaryPay;
use App\Http\Controllers\Users\PharmacistController;
use App\Http\Controllers\EmployeeOT\EmployeeOTController;
use App\Http\Controllers\Shift\ShiftManagementController;
use App\Http\Controllers\Hospital\Branch\BranchController;
use App\Http\Controllers\StaffSalary\StaffSalaryController;
use App\Http\Controllers\Pharmacy\Product\ProductController;
use App\Http\Controllers\Pharmacy\Supplier\SupplierController;
use App\Http\Controllers\DoctorSession\DoctorSessionController;
use App\Http\Controllers\PatienSessions\MainQuestionsController;
use App\Http\Controllers\PatientSession\QuestionAnswerController;
use App\Http\Controllers\Pharmacy\Product\ProductStockController;
use App\Http\Controllers\Pharmacy\Purchasing\PurchasingController;
use App\Http\Controllers\Pharmacy\DashboardPOS\DashboardController;
use App\Http\Controllers\Pharmacy\Product\ProductDiscountController;
use App\Http\Controllers\LeavesManagement\LeavesManagementController;
use App\Http\Controllers\AppointmentSchedule\DoctorScheduleController;
use App\Http\Controllers\DoctorDisease\DoctorCreatedDiseaseController;
use App\Http\Controllers\PatientAppointment\PatientAppointmentController;
use App\Http\Controllers\DoctorScheduleCancel\DoctorScheduleCancelController;
use App\Http\Controllers\NotificationManagement\NotificationManagementController;

// Helper function to validate super admin token manually
$validateSuperAdminToken = function () {
    $token = request()->bearerToken();
    if (!$token) {
        return ['error' => response()->json(['message' => 'No token provided'], 401)];
    }
    
    $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
    if (!$accessToken) {
        return ['error' => response()->json(['message' => 'Invalid token'], 401)];
    }
    
    $user = $accessToken->tokenable;
    if (!$user) {
        return ['error' => response()->json(['message' => 'User not found'], 401)];
    }
    
    // Check if user is a super admin (role_as = 1)
    if ($user->role_as != 1) {
        return ['error' => response()->json(['message' => 'Unauthorized. User is not a super admin', 'role_as' => $user->role_as], 403)];
    }
    
    // Set the user for Auth facade
    auth()->setUser($user);
    
    return ['user' => $user];
};

// Branch routes with manual token validation (bypassing problematic auth:sanctum)
Route::post('/create-branch', function () use ($validateSuperAdminToken) {
    $result = $validateSuperAdminToken();
    if (isset($result['error'])) return $result['error'];
    
    // Validate the request manually
    $validator = \Illuminate\Support\Facades\Validator::make(request()->all(), [
        'center_name' => ['required', 'string', 'min:1', 'max:255', 'unique:branches,center_name'],
        'register_number' => ['nullable', 'string', 'min:1', 'max:255', 'unique:branches,register_number'],
        'register_document' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,png', 'max:5120'],
        'center_type' => ['nullable', 'string', 'min:1', 'max:255'],
        'division' => ['nullable', 'string', 'min:1', 'max:255'],
        'division_number' => ['nullable', 'string', 'min:1', 'max:255'],
        'owner_type' => ['nullable', 'string', 'min:1', 'max:255'],
        'owner_full_name' => ['nullable', 'string', 'min:1', 'max:255'],
        'owner_id_number' => ['nullable', 'string', 'min:1', 'max:255'],
        'owner_contact_number' => ['nullable', 'string', 'min:1', 'max:255'],
    ]);
    
    if ($validator->fails()) {
        return response()->json([
            'status' => 422,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }
    
    $validated = $validator->validated();
    
    // Handle file upload
    $filePath = null;
    if (request()->hasFile('register_document')) {
        $filePath = request()->file('register_document')->store('documents/branches', 'public');
    }
    
    // Create the branch
    try {
        $branch = \App\Models\Hospital\Branch::create([
            'center_name' => $validated['center_name'],
            'register_number' => $validated['register_number'] ?? null,
            'register_document' => $filePath,
            'center_type' => $validated['center_type'] ?? null,
            'division' => $validated['division'] ?? null,
            'division_number' => $validated['division_number'] ?? null,
            'owner_type' => $validated['owner_type'] ?? null,
            'owner_full_name' => $validated['owner_full_name'] ?? null,
            'owner_id_number' => $validated['owner_id_number'] ?? null,
            'owner_contact_number' => $validated['owner_contact_number'] ?? null,
        ]);
        
        return response()->json([
            'status' => 200,
            'message' => 'Branch created successfully',
            'data' => $branch
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 500,
            'message' => 'Failed to create branch: ' . $e->getMessage()
        ], 500);
    }
});

Route::get('/get-branches', function () use ($validateSuperAdminToken) {
    $result = $validateSuperAdminToken();
    if (isset($result['error'])) return $result['error'];
    return app(BranchController::class)->getBranches(app(\App\Action\Hospital\Branch\GetAllBranches::class));
});

Route::post('/update-branch/{branchId}', function ($branchId) use ($validateSuperAdminToken) {
    $result = $validateSuperAdminToken();
    if (isset($result['error'])) return $result['error'];
    return app(BranchController::class)->updateBranch($branchId, app(\App\Http\Requests\Hospital\Branch\BranchUpdateFormRequest::class), app(\App\Action\Hospital\Branch\UpdateExistingBranch::class));
});

Route::delete('/delete-branch/{branchId}', function ($branchId) use ($validateSuperAdminToken) {
    $result = $validateSuperAdminToken();
    if (isset($result['error'])) return $result['error'];
    return app(BranchController::class)->deleteBranch($branchId, app(\App\Action\Hospital\Branch\DeleteExistingBranch::class));
});

// User delete routes with manual token validation (bypassing problematic auth:sanctum)
Route::delete('/delete-doctor-user/{user_id}', function ($user_id) use ($validateSuperAdminToken) {
    $result = $validateSuperAdminToken();
    if (isset($result['error'])) return $result['error'];
    return app(DoctorController::class)->deleteDoctor($user_id, app(\App\Action\Users\DoctorUser\DeleteExistingDoctorUser::class));
});

Route::delete('/delete-pharmacist-user/{user_id}', function ($user_id) use ($validateSuperAdminToken) {
    $result = $validateSuperAdminToken();
    if (isset($result['error'])) return $result['error'];
    return app(PharmacistController::class)->deletePharmacist($user_id, app(\App\Action\Users\PharmacistUser\DeleteExistingPharmacistUser::class));
});

Route::delete('/delete-cashier-user/{user_id}', function ($user_id) use ($validateSuperAdminToken) {
    $result = $validateSuperAdminToken();
    if (isset($result['error'])) return $result['error'];
    return app(CashierController::class)->deleteCashier($user_id, app(\App\Action\Users\CashierUser\DeleteExistingCashierUser::class));
});

Route::delete('/delete-staff/{user_id}', function ($user_id) use ($validateSuperAdminToken) {
    $result = $validateSuperAdminToken();
    if (isset($result['error'])) return $result['error'];
    return app(StaffController::class)->deleteStaff($user_id);
});

Route::delete('/delete-supplier-entity/{user_id}', function ($user_id) use ($validateSuperAdminToken) {
    $result = $validateSuperAdminToken();
    if (isset($result['error'])) return $result['error'];
    return app(UsersController::class)->deleteSupplierEntity($user_id);
});

Route::delete('/delete-patient-user/{user_id}', function ($user_id) use ($validateSuperAdminToken) {
    $result = $validateSuperAdminToken();
    if (isset($result['error'])) return $result['error'];
    return app(PatientController::class)->deletepatient($user_id, app(\App\Action\Users\PatientUser\DeleteExistingpatientUser::class));
});

Route::middleware(['auth:sanctum', SuperAdminCheckMiddleware::class])->group(function () {
    Route::post('sign-out-admin', [UsersController::class, 'userSignOut']);

    // Doctor
    Route::post('/create-doctor', [DoctorController::class, 'createDoctor']);
    Route::get('/get-doctors', [DoctorController::class, 'getDoctorsDetails']);
    Route::put('/update-doctor-user/{user_id}', [DoctorController::class, 'updateDoctor']);
    // delete route moved outside middleware group with manual token validation

    // Nurse
    Route::post('/create-nurse', [NurseController::class, 'createNurse']);
    Route::get('/get-nurses', [NurseController::class, 'getNursesDetails']);

    //Pharmacist
    Route::post('/create-pharmacist', [PharmacistController::class, 'createPharmacist']);
    Route::get('/get-pharmacists', [PharmacistController::class, 'getPharmacistsDetails']);
    Route::put('/update-pharmacist-user/{user_id}', [PharmacistController::class, 'updatePharmacist']);
    // delete route moved outside middleware group with manual token validation

    //Cashier
    Route::post('/create-cashier', [CashierController::class, 'createCashier']);
    Route::get('/get-cashiers', [CashierController::class, 'getCashiersDetails']);
    Route::put('/update-cashier-user/{user_id}', [CashierController::class, 'updateCashier']);
    // delete route moved outside middleware group with manual token validation

    // Staff - Generic routes for all other user types
    Route::post('/create-it-assistant', [StaffController::class, 'createStaff']);
    Route::post('/create-branch-admin', [StaffController::class, 'createStaff']);
    Route::post('/create-center-aids', [StaffController::class, 'createStaff']);
    Route::post('/create-support-staff', [StaffController::class, 'createStaff']);
    Route::post('/create-receptionist', [StaffController::class, 'createStaff']);
    Route::post('/create-therapist', [StaffController::class, 'createStaff']);
    Route::post('/create-radiology-technologist', [StaffController::class, 'createStaff']);
    Route::post('/create-medical-technologist', [StaffController::class, 'createStaff']);
    Route::post('/create-phlebotomist', [StaffController::class, 'createStaff']);
    Route::post('/create-surgical-technologist', [StaffController::class, 'createStaff']);
    Route::post('/create-counselor', [StaffController::class, 'createStaff']);
    Route::post('/create-hrm-manager', [StaffController::class, 'createStaff']);
    Route::post('/create-dietitian', [StaffController::class, 'createStaff']);
    Route::post('/create-paramedic', [StaffController::class, 'createStaff']);
    Route::post('/create-audiologist', [StaffController::class, 'createStaff']);
    Route::post('/create-medical-assistant', [StaffController::class, 'createStaff']);
    Route::post('/create-clerk', [StaffController::class, 'createStaff']);
    Route::post('/create-director', [StaffController::class, 'createStaff']);
    Route::post('/create-secretary', [StaffController::class, 'createStaff']);
    Route::get('/get-staff', [StaffController::class, 'getStaff']);
    Route::put('/update-staff/{user_id}', [StaffController::class, 'updateStaff']);
    // delete route moved outside middleware group with manual token validation
    
    // Supplier Entity Users
    Route::put('/update-supplier-entity/{user_id}', [\App\Http\Controllers\Users\UsersController::class, 'updateSupplierEntity']);
    // delete route moved outside middleware group with manual token validation

    // Patients
    Route::get('get-patients-details', [PatientController::class, 'getPatientsDetails']);
    Route::get('search-patients', [PatientController::class, 'searchPatients']);
    Route::get('/get-patient-by-phone/{phone}', [PatientController::class, 'getPatientByPhone']);
    Route::put('/update-patient-user/{user_id}', [PatientController::class, 'updatePatient']);
    // delete route moved outside middleware group with manual token validation

    //AllUser
    Route::get('/get-all-users', [AllUserController::class, 'getAllUsers']);
    Route::get('/get-all-users-with-salary', [AllUserController::class, 'getAllUsersWithSalary']);
    Route::get('/get-users-details-for-update/{userId}', [AllUserController::class, 'getUserDetailsForUpdate']);

    // User Resignations
    Route::get('/resignation-reasons', [UserResignationController::class, 'getReasons']);
    Route::get('/resignations', [UserResignationController::class, 'index']);
    Route::get('/resignations/user/{userId}', [UserResignationController::class, 'getByUser']);
    Route::post('/resignations', [UserResignationController::class, 'store']);
    Route::put('/resignations/{id}/status', [UserResignationController::class, 'updateStatus']);
    Route::delete('/resignations/{id}', [UserResignationController::class, 'destroy']);

    // Product
    Route::post('/create-product', [ProductController::class, 'addProduct']);
    Route::get('/get-products', [ProductController::class, 'getProductsDetails']);
    Route::get('/get-products-branch', [ProductController::class, 'getProductsWithBranchStock']);
    Route::get('/get-product-item-name', [ProductController::class, 'getProductItemNameAndCode']);
    Route::post('/update-product/{productId}', [ProductController::class, 'updateProduct']);
    Route::delete('/delete-product/{productId}', [ProductController::class, 'deleteProduct']);
    Route::get('/product/{productId}/branch-stock', [ProductController::class, 'getProductBranchStock']);
    Route::post('/product/{productId}/branch-stock', [ProductController::class, 'updateBranchStock']);

    // Purchasing
    Route::post('/purchasing-product', [PurchasingController::class, 'addPurchasing']);
    Route::get('/get-purchasing-products', [PurchasingController::class, 'getPurchasingDetails']);
    Route::get('/fetch-purchasing-details', [PurchasingController::class, 'fetchPurchasingDetails']);

    // supplier
    Route::post('/create-supplier', [SupplierController::class, 'addSupplier']);
    Route::get('/get-suppliers', [SupplierController::class, 'getSupplierDetails']);
    Route::post('/update-supplier/{supplierId}', [SupplierController::class, 'updateSupplier']);
    Route::delete('/delete-supplier/{supplierId}', [SupplierController::class, 'deleteSupplier']);
    Route::post('/create-supplier-account/{supplierId}', [SupplierController::class, 'createUserAccount']);

    // PharmacyPOS Dashboard
    Route::get('/dashboard-details', [DashboardController::class, 'getDashboardDetails']);

    // Product Stock
    Route::post('/update-product-stock', [ProductStockController::class, 'updateProductStock']);
    Route::post('/add-product-damaged-stock', [ProductStockController::class, 'reduceProductDamagedStock']);
    Route::post('/add-product-transfer-stock', [ProductStockController::class, 'reduceProductTransferStock']);
    Route::get('/get-damaged-product', [ProductStockController::class, 'getProductDamagedStock']);
    Route::get('/get-transfer-product', [ProductStockController::class, 'getProductTransferStock']);
    Route::get('/get-product-renewed-stock', [ProductStockController::class, 'getProductRenewStock']);

    // Product discount
    Route::post('/add-product-discount', [ProductDiscountController::class, 'addProductDiscount']);
    Route::get('/get-product-discount', [ProductDiscountController::class, 'getProductsDiscounts']);
    Route::delete('/delete-product-discount/{productId}', [ProductDiscountController::class, 'removeProductDiscount']);

    //Shift
    Route::post('/create-shift', [ShiftManagementController::class, 'createShift']);
    Route::get('/get-all-shifts', [ShiftManagementController::class, 'getAllShifts']);
    Route::put('/update-shift/{id}', [ShiftManagementController::class, 'updateShift']);
    Route::delete('/delete-shift/{id}', [ShiftManagementController::class, 'deleteShift']);

    //Leave
    Route::get('/get-admin-user-leaves-request', [LeavesManagementController::class, 'getAllLeaves']);
    Route::post('/admin-user-leave-approve', [LeavesManagementController::class, 'adminLeaveApprove']);
    Route::post('/admin-user-leave-reject', [LeavesManagementController::class, 'adminLeaveReject']);

    //Notification
    Route::get('/get-admin-user-notifications/{user_id}', [NotificationManagementController::class, 'getNotificationByUserID']);
    Route::post('/admin-user-notifications/mark-read', [NotificationManagementController::class, 'markNotificationsAsRead']);

    //StaffSalary
    Route::post('/create-staff-salary', [StaffSalaryController::class, 'createStaffSalary']);
    Route::get('/get-all-staff-salary', [StaffSalaryController::class, 'getAllStaffSalary']);
    Route::put('/update-staff-salary/{id}', [StaffSalaryController::class, 'updateStaffSalary']);
    Route::delete('/delete-staff-salary/{id}', [StaffSalaryController::class, 'deleteStaffSalary']);

    //EmployeeOT
    Route::post('/create-employee-ot', [EmployeeOTController::class, 'createEmployeeOT']);
    Route::get('/get-all-employee-ot', [EmployeeOTController::class, 'getAllEmployeeOT']);
    Route::put('/update-employee-ot/{id}', [EmployeeOTController::class, 'updateEmployeeOT']);
    Route::delete('/delete-employee-ot/{id}', [EmployeeOTController::class, 'deleteEmployeeOT']);

    //StaffSalaryPay
    Route::post('/create-staff-salary-pay', [StaffSalaryPay::class, 'createStaffSalaryPay']);
    Route::get('/get-all-staff-salary-pay', [StaffSalaryPay::class, 'getAllStaffSalaryPay']);
    Route::put('/update-staff-salary-pay/{id}', [StaffSalaryPay::class, 'updateStaffSalary']);
    Route::get('/get-all-staff-salary-pay-filter', [StaffSalaryPay::class, 'getAllStaffSalaryPayFilter']);

    Route::get('/get-all-staff-salary-pay-check', [StaffSalaryPay::class, 'getAllStaffSalaryPayCheck']);

    //DoctorSchedule
    Route::post('/create-doctor-schedule', [DoctorScheduleController::class, 'createDoctorSchedule']);
    Route::get('/get-all-doctor-schedule', [DoctorScheduleController::class, 'getAllDoctorSchedule']);
    Route::put('/update-doctor-schedule/{id}', [DoctorScheduleController::class, 'updateDoctorSchedule']);
    Route::delete('/delete-doctor-schedule/{id}', [DoctorScheduleController::class, 'deleteDoctorSchedule']);

    Route::get('/get-filter-doctor-schedules', [DoctorScheduleController::class, 'getDoctorSchedules']);
    Route::post('/check-doctor-availability', [DoctorScheduleController::class, 'checkDoctorAvailability']);

    //PatientAppointment
    Route::post('/admin-create-patient-appointment', [PatientAppointmentController::class, 'adminCreatePatientAppointment']);
    Route::get('/get-all-patient-appointment', [PatientAppointmentController::class, 'getAllPatientAppointment']);
    Route::delete('/delete-appointment/{id}', [PatientAppointmentController::class, 'deletePatientAppointment']);

    Route::get('/get-filter-appointment', [PatientAppointmentController::class, 'getAppointments']);

    //DoctorScheduleCancel
    Route::get('/get-all-cancel-schedules', [DoctorScheduleCancelController::class, 'getAllDoctorScheduleCancel']);
    Route::post('/approve-cancel-schedule/{id}', [DoctorScheduleCancelController::class, 'approveCancellation']);
    Route::post('/reject-cancel-schedule/{id}', [DoctorScheduleCancelController::class, 'rejectCancellation']);

    // Main question
    Route::post('/add-main-question', [MainQuestionsController::class, 'addMainQuestion']);
    Route::get('/get-all-doctor-questions', [MainQuestionsController::class, 'getAllMainQuestions']);
    Route::put('/update-main-question/{id}', [MainQuestionsController::class, 'updateMainQuestion']);
    Route::delete('/delete-main-question/{id}', [MainQuestionsController::class, 'deleteMainQuestion']);

    Route::post('/create-doctor-session', [DoctorSessionController::class, 'addDoctorSession']);

    // Question Answer
    Route::post('/add-question-answer', [QuestionAnswerController::class, 'addNewAnswer']);
    Route::put('/update-question-answer/{id}', [QuestionAnswerController::class, 'updateQuestionAnswer']);
    Route::delete('/delete-question-answer/{id}', [QuestionAnswerController::class, 'deleteQuestionAnswer']);
    Route::get('/get-question-answers/{questionId}', [QuestionAnswerController::class, 'getAnswersByQuestionId']);

    //Doctor Disease
    Route::post('/create-doctor-disease', [DoctorCreatedDiseaseController::class, 'createDoctorDisease']);
    Route::put('/update-doctor-disease/{id}', [DoctorCreatedDiseaseController::class, 'updateDoctorDisease']);
    Route::get('/get-all-doctor-disease', [DoctorCreatedDiseaseController::class, 'getAllDoctorDisease']);
    Route::delete('/delete-doctor-disease/{id}', [DoctorCreatedDiseaseController::class, 'deleteDoctorDisease']);
});

/**
 * Super Admin - POS Management Routes
 * 
 * These routes allow Super Admin to view and manage POS data across all branches.
 * Super Admin can:
 * - Access all branches
 * - View system-wide POS data
 * - Perform sales on behalf of any branch
 * - View financial analytics per branch
 * - Manage cashiers across all branches
 */
use App\Http\Controllers\SuperAdmin\SuperAdminPOSController;

Route::middleware(['auth:sanctum', SuperAdminCheckMiddleware::class])->prefix('super-admin/pos')->group(function () {
    // Dashboard Stats - Aggregated POS performance (all branches or filtered)
    Route::get('/dashboard-stats', [SuperAdminPOSController::class, 'getDashboardStats']);
    
    // Analytics - Consolidated sales analytics
    Route::get('/analytics', [SuperAdminPOSController::class, 'getAnalytics']);
    
    // Transactions - View all transactions (all branches or filtered)
    Route::get('/transactions', [SuperAdminPOSController::class, 'getTransactions']);
    
    // Create Transaction - Perform sales on behalf of any branch
    Route::post('/transactions', [SuperAdminPOSController::class, 'createTransaction']);
    
    // Branches - Get list of all branches for filter dropdown
    Route::get('/branches', [SuperAdminPOSController::class, 'getBranches']);
    
    // Cashiers - Get all cashiers with performance (optionally filter by branch)
    Route::get('/cashiers', [SuperAdminPOSController::class, 'getBranchCashiers']);
    
    // Products - Get products for a specific branch
    Route::get('/products', [SuperAdminPOSController::class, 'getBranchProducts']);
    
    // Inventory list - Same as cashier inventory (all products with stock > 0)
    Route::get('/inventory-list', [\App\Http\Controllers\Pharmacy\Product\ProductController::class, 'getInventoryList']);
});

/**
 * Super Admin - Audit Log Routes
 */
Route::middleware(['auth:sanctum', SuperAdminCheckMiddleware::class])->prefix('super-admin/audit')->group(function () {
    Route::get('/logs', [\App\Http\Controllers\Api\AuditLogController::class, 'getAllAuditLogs']);
    Route::get('/transactions/{transactionId}/history', [\App\Http\Controllers\Api\AuditLogController::class, 'getTransactionHistory']);
    Route::get('/users/{userId}/activity', [\App\Http\Controllers\Api\AuditLogController::class, 'getUserActivity']);
    Route::get('/stats', [\App\Http\Controllers\Api\AuditLogController::class, 'getAuditStats']);
});

/**
 * Enhanced POS Routes - Batch Pricing, Discounts, Pricing Controls
 */
use App\Http\Controllers\API\SuperAdmin\EnhancedPOSController;

Route::middleware(['auth:sanctum', SuperAdminCheckMiddleware::class])->prefix('super-admin/enhanced-pos')->group(function () {
    // Dashboard Stats
    Route::get('/dashboard-stats', [EnhancedPOSController::class, 'getDashboardStats']);
    
    // Batch Pricing
    Route::get('/products/{productId}/batches', [EnhancedPOSController::class, 'getProductBatches']);
    Route::get('/reports/stock-aging', [EnhancedPOSController::class, 'getStockAgingReport']);
    Route::get('/reports/expiring-soon', [EnhancedPOSController::class, 'getExpiringSoonReport']);
    Route::get('/reports/batch-profit', [EnhancedPOSController::class, 'getBatchProfitAnalysis']);
    
    // Discounts
    Route::get('/discounts/applicable', [EnhancedPOSController::class, 'getApplicableDiscounts']);
    Route::get('/discounts/active-offers', [EnhancedPOSController::class, 'getActiveOffers']);
    Route::post('/discounts/apply', [EnhancedPOSController::class, 'applyDiscount']);
    Route::get('/discounts/impact-report', [EnhancedPOSController::class, 'getDiscountImpactReport']);
    Route::post('/discounts', [EnhancedPOSController::class, 'storeDiscount']);
    Route::put('/discounts/{id}', [EnhancedPOSController::class, 'updateDiscount']);
    Route::delete('/discounts/{id}', [EnhancedPOSController::class, 'deleteDiscount']);
    
    // Pricing Controls
    Route::get('/pricing-controls', [EnhancedPOSController::class, 'listPricingControls']);
    Route::get('/pricing-controls/{productId}', [EnhancedPOSController::class, 'getPricingControl']);
    Route::post('/pricing-controls', [EnhancedPOSController::class, 'storePricingControl']);
    Route::post('/validate-price', [EnhancedPOSController::class, 'validatePrice']);
    
    // Price Override Requests
    Route::get('/price-overrides/pending', [EnhancedPOSController::class, 'getPendingOverrideRequests']);
    Route::post('/price-overrides', [EnhancedPOSController::class, 'createOverrideRequest']);
    Route::post('/price-overrides/{id}/approve', [EnhancedPOSController::class, 'approveOverrideRequest']);
    Route::post('/price-overrides/{id}/deny', [EnhancedPOSController::class, 'denyOverrideRequest']);
    
    // Audit Logs
    Route::get('/audit-logs', [EnhancedPOSController::class, 'getAuditLogs']);
    Route::get('/audit-logs/discount-impact', [EnhancedPOSController::class, 'getDiscountImpactFromLogs']);
    Route::get('/audit-logs/price-overrides', [EnhancedPOSController::class, 'getPriceOverrideReport']);
});

// ============================================
// CHATBOT MANAGEMENT ROUTES (Super Admin)
// ============================================
use App\Http\Controllers\SuperAdmin\ChatbotManagementController;

Route::prefix('super-admin/chatbot')->middleware(['auth:sanctum', SuperAdminCheckMiddleware::class])->group(function () {
    // FAQ Management
    Route::get('/faqs', [ChatbotManagementController::class, 'index']);
    Route::post('/faqs', [ChatbotManagementController::class, 'store']);
    Route::get('/faqs/{id}', [ChatbotManagementController::class, 'show']);
    Route::put('/faqs/{id}', [ChatbotManagementController::class, 'update']);
    Route::delete('/faqs/{id}', [ChatbotManagementController::class, 'destroy']);
    Route::patch('/faqs/{id}/toggle-status', [ChatbotManagementController::class, 'toggleStatus']);
    
    // Disease Mappings
    Route::get('/disease-mappings', [ChatbotManagementController::class, 'getDiseaseMappings']);
    Route::post('/disease-mappings', [ChatbotManagementController::class, 'createDiseaseMapping']);
    Route::put('/disease-mappings/{id}', [ChatbotManagementController::class, 'updateDiseaseMapping']);
    Route::delete('/disease-mappings/{id}', [ChatbotManagementController::class, 'deleteDiseaseMapping']);
    
    // Logs & Analytics
    Route::get('/logs', [ChatbotManagementController::class, 'getLogs']);
    Route::get('/analytics', [ChatbotManagementController::class, 'getAnalytics']);
    Route::get('/categories', [ChatbotManagementController::class, 'getCategories']);
});
