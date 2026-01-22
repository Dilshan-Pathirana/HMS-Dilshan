<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Users\NurseController;
use App\Http\Controllers\Users\DoctorController;
use App\Http\Controllers\Users\CashierController;
use App\Http\Controllers\Users\StaffController;
use App\Http\Controllers\Users\PharmacistController;
use App\Http\Controllers\Shift\ShiftManagementController;
use App\Http\Controllers\Users\AllUserController;
use App\Http\Middleware\AdminOrBranchAdminMiddleware;

/**
 * Branch Admin Routes
 * 
 * These routes are accessible by both Super Admin and Branch Admin users.
 * Branch Admin users can create staff members for their own branch.
 */
Route::middleware(['auth:sanctum', AdminOrBranchAdminMiddleware::class])->group(function () {
    
    // Get staff for Branch Admin's branch
    Route::get('/branch-admin/staff', [StaffController::class, 'getBranchStaff']);
    
    // Doctor
    Route::post('/branch-admin/create-doctor', [DoctorController::class, 'createDoctor']);
    
    // Nurse
    Route::post('/branch-admin/create-nurse', [NurseController::class, 'createNurse']);
    
    // Pharmacist
    Route::post('/branch-admin/create-pharmacist', [PharmacistController::class, 'createPharmacist']);
    
    // Cashier
    Route::post('/branch-admin/create-cashier', [CashierController::class, 'createCashier']);
    
    // Staff - Generic routes for all other user types
    Route::post('/branch-admin/create-it-assistant', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-center-aids', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-support-staff', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-receptionist', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-therapist', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-radiology-technologist', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-medical-technologist', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-phlebotomist', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-surgical-technologist', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-counselor', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-hrm-manager', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-dietitian', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-paramedic', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-audiologist', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-medical-assistant', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-clerk', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-director', [StaffController::class, 'createStaff']);
    Route::post('/branch-admin/create-secretary', [StaffController::class, 'createStaff']);
    
    // Get all users (for shift management and other features)
    Route::get('/get-all-users', [AllUserController::class, 'getAllUsers']);
    
    // Shift Management
    Route::post('/create-shift', [ShiftManagementController::class, 'createShift']);
    Route::get('/get-all-shifts', [ShiftManagementController::class, 'getAllShifts']);
    Route::put('/update-shift/{id}', [ShiftManagementController::class, 'updateShift']);
    Route::delete('/delete-shift/{id}', [ShiftManagementController::class, 'deleteShift']);
    
    // Overtime Management
    Route::post('/assign-overtime', [ShiftManagementController::class, 'assignOvertime']);
    Route::put('/update-overtime/{id}', [ShiftManagementController::class, 'updateOvertime']);
    Route::delete('/delete-overtime/{id}', [ShiftManagementController::class, 'deleteOvertime']);
    Route::post('/acknowledge-overtime/{id}', [ShiftManagementController::class, 'acknowledgeOvertime']);
    Route::get('/get-user-overtime-assignments', [ShiftManagementController::class, 'getUserOvertimeAssignments']);
});

// Import Purchase Request Controller for Branch Admin PR management
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\Pharmacy\Supplier\SupplierController;

/**
 * Branch Admin - Purchase Request Management Routes
 */
Route::middleware(['auth:sanctum', AdminOrBranchAdminMiddleware::class])->prefix('branch-admin')->group(function () {
    
    // Get suppliers for branch admin
    Route::get('/suppliers', [SupplierController::class, 'getSupplierDetails']);
    
    // Search items (must be before {id} route to avoid conflicts)
    Route::get('/purchase-requests/search-items', [PurchaseRequestController::class, 'searchItems']);
    
    // Get pending PRs with filters
    Route::get('/purchase-requests/pending', [PurchaseRequestController::class, 'getPendingPRsForAdmin']);
    
    // Get pending count for badge
    Route::get('/purchase-requests/pending-count', [PurchaseRequestController::class, 'getPendingCount']);
    
    // Get single PR details (reuse existing show method)
    Route::get('/purchase-requests/{id}', [PurchaseRequestController::class, 'show']);
    
    // Update PR (edit items, supplier, etc.)
    Route::put('/purchase-requests/{id}/update', [PurchaseRequestController::class, 'updatePRByAdmin']);
    
    // Approve PR
    Route::post('/purchase-requests/{id}/approve', [PurchaseRequestController::class, 'approvePR']);
    
    // Reject PR
    Route::post('/purchase-requests/{id}/reject', [PurchaseRequestController::class, 'rejectPR']);
    
    // Request clarification
    Route::post('/purchase-requests/{id}/clarify', [PurchaseRequestController::class, 'requestClarification']);
});

// Import Notification Controller for Branch Admin notifications
use App\Http\Controllers\NotificationManagement\NotificationManagementController;
use App\Http\Controllers\BranchAdmin\BranchAdminRequestsController;
use App\Http\Controllers\BranchAdmin\BranchAdminPOSController;
use App\Http\Controllers\BranchAdmin\BranchAdminFeedbackController;

/**
 * Branch Admin - POS Management Routes
 * 
 * These routes allow Branch Admin to view and manage POS data for their branch.
 * Branch Admin can:
 * - Access POS data only for assigned branch
 * - View branch analytics
 * - Perform sales if required
 * - Manage cashiers
 */
Route::middleware(['auth:sanctum', AdminOrBranchAdminMiddleware::class, 'branch.isolation'])->prefix('branch-admin/pos')->group(function () {
    // Dashboard Stats - Aggregated branch POS performance
    Route::get('/dashboard-stats', [BranchAdminPOSController::class, 'getDashboardStats']);
    
    // Analytics - Branch-specific sales analytics
    Route::get('/analytics', [BranchAdminPOSController::class, 'getAnalytics']);
    
    // Transactions - View all branch transactions (across all cashiers)
    Route::get('/transactions', [BranchAdminPOSController::class, 'getBranchTransactions']);
    
    // Create Transaction - Branch Admin can perform sales
    Route::post('/transactions', [BranchAdminPOSController::class, 'createTransaction']);
    
    // Cashier Management - Get all cashiers with performance
    Route::get('/cashiers', [BranchAdminPOSController::class, 'getBranchCashiers']);
    
    // Cashier EOD Status - View EOD status for all cashiers
    Route::get('/cashiers/eod-status', [BranchAdminPOSController::class, 'getCashiersEODStatus']);
    
    // Products - Get products for the branch
    Route::get('/products', [BranchAdminPOSController::class, 'getBranchProducts']);
    
    // Inventory List - Get all products with stock for POS
    Route::get('/inventory-list', [BranchAdminPOSController::class, 'getInventoryList']);
    
    // Search Patients - Search patients for POS
    Route::get('/search-patients', [BranchAdminPOSController::class, 'searchPatients']);
    
    // Search Products - Search products for POS
    Route::get('/search-products', [BranchAdminPOSController::class, 'searchProducts']);
    
    // Cash Entries - Get and create cash entries
    Route::get('/cash-entries', [BranchAdminPOSController::class, 'getCashEntries']);
    Route::post('/cash-entries', [BranchAdminPOSController::class, 'createCashEntry']);
    
    // Cash Summary - Get cash summary for the day
    Route::get('/cash-summary', [BranchAdminPOSController::class, 'getCashSummary']);
    
    // EOD Summary - Get EOD summary for monitoring
    Route::get('/eod-summary', [BranchAdminPOSController::class, 'getEODSummary']);
    
    // EOD Submit - Submit EOD for branch admin
    Route::post('/eod-submit', [BranchAdminPOSController::class, 'submitEOD']);
    
    // EOD Requests - Get all cashier EOD submissions for approval
    Route::get('/eod-requests', [BranchAdminPOSController::class, 'getEODRequests']);
    
    // EOD Approve - Approve a cashier's EOD
    Route::post('/eod-requests/{id}/approve', [BranchAdminPOSController::class, 'approveEOD']);
    
    // EOD Reject - Reject/send back a cashier's EOD for revision
    Route::post('/eod-requests/{id}/reject', [BranchAdminPOSController::class, 'rejectEOD']);
    
    // Daily Sales Trend - For reports
    Route::get('/daily-sales-trend', [BranchAdminPOSController::class, 'getDailySalesTrend']);
});

/**
 * Branch Admin - Notification Routes
 */
Route::middleware(['auth:sanctum', AdminOrBranchAdminMiddleware::class])->prefix('branch-admin')->group(function () {
    // Get notifications
    Route::get('/notifications/{user_id}', [NotificationManagementController::class, 'getNotificationByUserID']);
    
    // Mark notifications as read
    Route::post('/notifications/mark-read', [NotificationManagementController::class, 'markNotificationsAsRead']);
    
    // Get unread notification count
    Route::get('/notifications-count', [PurchaseRequestController::class, 'getUnreadNotificationCount']);
});

/**
 * Branch Admin - Requests Module Routes (EOD Reports, Cash Entries)
 * All routes enforce branch isolation to prevent cross-branch access
 */
Route::middleware(['auth:sanctum', AdminOrBranchAdminMiddleware::class, 'branch.isolation'])->prefix('branch-admin/requests')->group(function () {
    // Get request stats for dashboard
    Route::get('/stats', [BranchAdminRequestsController::class, 'getRequestStats']);
    
    // EOD Reports
    Route::get('/eod-reports', [BranchAdminRequestsController::class, 'getEODReports']);
    Route::post('/eod-reports/{id}/approve', [BranchAdminRequestsController::class, 'approveEODReport']);
    Route::post('/eod-reports/{id}/reject', [BranchAdminRequestsController::class, 'rejectEODReport']);
    Route::post('/eod-reports/{id}/flag', [BranchAdminRequestsController::class, 'flagEODDiscrepancy']);
    Route::post('/eod-reports/{id}/reset', [BranchAdminRequestsController::class, 'resetEODReport']);
    
    // Cash Entries
    Route::get('/cash-entries', [BranchAdminRequestsController::class, 'getCashEntries']);
    Route::post('/cash-entries/{id}/approve', [BranchAdminRequestsController::class, 'approveCashEntry']);
    Route::post('/cash-entries/{id}/reject', [BranchAdminRequestsController::class, 'rejectCashEntry']);
    
    // Doctor Schedule Requests
    Route::get('/schedule-requests', [BranchAdminRequestsController::class, 'getScheduleRequests']);
    Route::post('/schedule-requests/{id}/approve', [BranchAdminRequestsController::class, 'approveScheduleRequest']);
    Route::post('/schedule-requests/{id}/reject', [BranchAdminRequestsController::class, 'rejectScheduleRequest']);
    Route::post('/schedule-requests/{id}/request-revision', [BranchAdminRequestsController::class, 'requestRevisionScheduleRequest']);
    
    // Get approved doctor schedules for the branch
    Route::get('/doctor-schedules', [BranchAdminRequestsController::class, 'getApprovedDoctorSchedules']);
    
    // Schedule Modification Requests (Block dates, delay start, limit appointments, etc.)
    Route::get('/modification-requests', [BranchAdminRequestsController::class, 'getModificationRequests']);
    Route::post('/modification-requests/{id}/approve', [BranchAdminRequestsController::class, 'approveModificationRequest']);
    Route::post('/modification-requests/{id}/reject', [BranchAdminRequestsController::class, 'rejectModificationRequest']);
    
    // Employee Schedule Change Requests (shift change, swap, time off, cancellation)
    Route::post('/employee-schedule-requests/{id}/approve', [BranchAdminRequestsController::class, 'approveEmployeeScheduleRequest']);
    Route::post('/employee-schedule-requests/{id}/reject', [BranchAdminRequestsController::class, 'rejectEmployeeScheduleRequest']);
});

/**
 * Branch Admin - Audit Log Routes
 * All routes enforce branch isolation
 */
Route::middleware(['auth:sanctum', AdminOrBranchAdminMiddleware::class, 'branch.isolation'])->prefix('branch-admin/audit')->group(function () {
    Route::get('/logs', [\App\Http\Controllers\Api\AuditLogController::class, 'getBranchAuditLogs']);
    Route::get('/transactions/{transactionId}/history', [\App\Http\Controllers\Api\AuditLogController::class, 'getTransactionHistory']);
    Route::get('/users/{userId}/activity', [\App\Http\Controllers\Api\AuditLogController::class, 'getUserActivity']);
    Route::get('/stats', [\App\Http\Controllers\Api\AuditLogController::class, 'getAuditStats']);
});

/**
 * Branch Admin - Feedback Management Routes
 * Manage feedback from patients and staff
 */
Route::middleware(['auth:sanctum', AdminOrBranchAdminMiddleware::class])->prefix('branch-admin/feedbacks')->group(function () {
    // Get all feedbacks
    Route::get('/', [BranchAdminFeedbackController::class, 'index']);
    
    // Get feedback statistics
    Route::get('/stats', [BranchAdminFeedbackController::class, 'getStats']);
    
    // Get single feedback
    Route::get('/{id}', [BranchAdminFeedbackController::class, 'show']);
    
    // Respond to feedback
    Route::post('/{id}/respond', [BranchAdminFeedbackController::class, 'respond']);
    
    // Update feedback status
    Route::post('/{id}/status', [BranchAdminFeedbackController::class, 'updateStatus']);
    
    // Toggle flag on feedback
    Route::post('/{id}/flag', [BranchAdminFeedbackController::class, 'toggleFlag']);
    
    // Update internal notes
    Route::post('/{id}/notes', [BranchAdminFeedbackController::class, 'updateNotes']);
    
    // Update priority
    Route::post('/{id}/priority', [BranchAdminFeedbackController::class, 'updatePriority']);
});

/**
 * Submit Feedback Route (accessible by all authenticated users)
 */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/submit-feedback', [BranchAdminFeedbackController::class, 'store']);
});

/**
 * Branch Admin Staff Stats API - with manual token validation
 * Returns statistics about staff for a specific branch
 */
Route::get('/branch-admin/staff-stats', function () {
    $token = request()->bearerToken();
    if (!$token) {
        return response()->json(['message' => 'No token provided'], 401);
    }
    
    $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
    if (!$accessToken) {
        return response()->json(['message' => 'Invalid token'], 401);
    }
    
    $user = $accessToken->tokenable;
    if (!$user) {
        return response()->json(['message' => 'User not found'], 401);
    }
    
    // Check if user is a branch admin (role_as = 2) or super admin (role_as = 1)
    if (!in_array($user->role_as, [1, 2])) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    
    $branchId = $user->branch_id;
    
    // If super admin without branch_id, return all staff stats
    if ($user->role_as == 1 && !$branchId) {
        $totalStaff = \App\Models\AllUsers\User::where('role_as', '!=', 6)->count(); // Exclude patients
        $onLeave = \App\Models\LeavesManagement\LeavesManagement::where('status', 'approved')
            ->whereDate('leaves_start_date', '<=', now())
            ->whereDate('leaves_end_date', '>=', now())
            ->count();
        
        // On shift - staff with shifts that include today's day of week and current time is within shift hours
        $today = strtolower(now()->format('l')); // e.g., 'monday'
        $currentTime = now()->format('H:i:s');
        
        $onShift = \App\Models\Shift\Shift::where('days_of_week', 'like', '%' . $today . '%')
            ->where('start_time', '<=', $currentTime)
            ->where('end_time', '>=', $currentTime)
            ->count();
        
        // Pending leave requests
        $pendingApprovals = \App\Models\LeavesManagement\LeavesManagement::where('status', 'pending')->count();
        
        return response()->json([
            'status' => 200,
            'data' => [
                'totalStaff' => $totalStaff,
                'activeOnShift' => $onShift,
                'onLeave' => $onLeave,
                'pendingApprovals' => $pendingApprovals,
                'upcomingTrainings' => 0, // Placeholder - no training model exists
                'expiringSoonCerts' => 0, // Placeholder - no certification model exists
            ]
        ]);
    }
    
    // For branch admin, filter by their branch
    $totalStaff = \App\Models\AllUsers\User::where('branch_id', $branchId)
        ->where('role_as', '!=', 6) // Exclude patients
        ->count();
    
    // Get user IDs for this branch
    $branchUserIds = \App\Models\AllUsers\User::where('branch_id', $branchId)
        ->pluck('id')
        ->toArray();
    
    $onLeave = \App\Models\LeavesManagement\LeavesManagement::whereIn('user_id', $branchUserIds)
        ->where('status', 'approved')
        ->whereDate('leaves_start_date', '<=', now())
        ->whereDate('leaves_end_date', '>=', now())
        ->count();
    
    // On shift - staff with shifts for this branch that include today
    $today = strtolower(now()->format('l'));
    $currentTime = now()->format('H:i:s');
    
    $onShift = \App\Models\Shift\Shift::where('branch_id', $branchId)
        ->where('days_of_week', 'like', '%' . $today . '%')
        ->where('start_time', '<=', $currentTime)
        ->where('end_time', '>=', $currentTime)
        ->count();
    
    // Pending leave requests for branch staff
    $pendingApprovals = \App\Models\LeavesManagement\LeavesManagement::whereIn('user_id', $branchUserIds)
        ->where('status', 'pending')
        ->count();
    
    return response()->json([
        'status' => 200,
        'data' => [
            'totalStaff' => $totalStaff,
            'activeOnShift' => $onShift,
            'onLeave' => $onLeave,
            'pendingApprovals' => $pendingApprovals,
            'upcomingTrainings' => 0, // Placeholder
            'expiringSoonCerts' => 0, // Placeholder
        ]
    ]);
});
