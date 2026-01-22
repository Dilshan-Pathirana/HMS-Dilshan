<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\CashierUserMiddleware;
use App\Http\Controllers\Users\UsersController;
use App\Http\Controllers\Users\AllUserController;
use App\Http\Controllers\Users\PatientController;
use App\Http\Controllers\Shift\ShiftManagementController;
use App\Http\Controllers\Pharmacy\Product\ProductController;
use App\Http\Controllers\Pharmacy\Product\ProductStockController;
use App\Http\Controllers\Pharmacy\Purchasing\PurchasingController;
use App\Http\Controllers\Pharmacy\DashboardPOS\DashboardController;
use App\Http\Controllers\LeavesManagement\LeavesManagementController;
use App\Http\Controllers\NotificationManagement\NotificationManagementController;
use App\Http\Controllers\Cashier\CashierBillingController;
use App\Http\Controllers\Cashier\CashEntryController;
use App\Http\Controllers\Cashier\EODController;
use App\Http\Controllers\BranchAdmin\BranchAdminFeedbackController;

Route::middleware(['auth:sanctum', CashierUserMiddleware::class])->group(function () {
    Route::post('sign-out-cashier', [UsersController::class, 'userSignOut']);

    // Profile Management
    Route::get('/cashier-profile', [CashierBillingController::class, 'getProfile']);
    Route::put('/cashier-profile', [CashierBillingController::class, 'updateProfile']);
    Route::put('/cashier-profile/password', [CashierBillingController::class, 'changePassword']);
    Route::post('/cashier-profile/picture', [CashierBillingController::class, 'uploadProfilePicture']);

    // Products
    Route::get('/cashier-user-get-products', [ProductController::class, 'getProductsDetails']);
    Route::get('/cashier-search-products', [ProductController::class, 'searchProducts']);
    Route::get('/cashier-inventory-list', [ProductController::class, 'getInventoryList']);

    // PharmacyPOS Dashboard
    Route::get('/cashier-dashboard-details', [DashboardController::class, 'getDashboardDetails']);

    // Cashier user Product Stock
    Route::post('/cashier-update-product-stock', [ProductStockController::class, 'updateProductStock']);
    Route::post('/cashier-add-product-damaged-stock', [ProductStockController::class, 'reduceProductDamagedStock']);
    Route::post('/cashier-add-product-transfer-stock', [ProductStockController::class, 'reduceProductTransferStock']);
    Route::get('/cashier-get-damaged-product', [ProductStockController::class, 'getProductDamagedStock']);
    Route::get('/cashier-get-transfer-product', [ProductStockController::class, 'getProductTransferStock']);
    Route::get('/cashier-get-product-renewed-stock', [ProductStockController::class, 'getProductRenewStock']);

    // Cashier user Purchasing
    Route::post('/cashier-purchasing-product', [PurchasingController::class, 'addPurchasing']);
    Route::get('/cashier-get-purchasing-products', [PurchasingController::class, 'getPurchasingDetails']);
    Route::get('/cashier-fetch-purchasing-details', [PurchasingController::class, 'fetchPurchasingDetails']);

    //Shift
    Route::get('/get-all-cashier-user-shifts/{user_id}', [ShiftManagementController::class, 'getAllShiftsUserID']);

    // Cashier Leaves management
    Route::post('/cashier-user-add-leave', [LeavesManagementController::class, 'addLeaves']);
    Route::get('/get-cashier-user-leaves/{user_id}', [LeavesManagementController::class, 'getLeavesByUserID']);

    //AllUser
    Route::get('/cashier-get-all-users', [AllUserController::class, 'getAllUsers']);

    // Cashier Leaves Request
    Route::get('/get-cashier-user-leaves-request/{assigner_id}', [LeavesManagementController::class, 'getLeavesByAssignerID']);
    Route::post('/cashier-user-leave-approve', [LeavesManagementController::class, 'leaveApprove']);
    Route::post('/cashier-user-leave-reject', [LeavesManagementController::class, 'leaveReject']);

    //Notification
    Route::get('/get-cashier-user-notifications/{user_id}', [NotificationManagementController::class, 'getNotificationByUserID']);
    Route::post('/cashier-user-notifications/mark-read', [NotificationManagementController::class, 'markNotificationsAsRead']);

    // Patients
    Route::get('get-cashier-patients-details', [PatientController::class, 'getPatientsDetails']);
    Route::get('cashier-search-patients', [PatientController::class, 'searchPatients']);

    // Feedback & Complaints
    Route::post('/submit-feedback', [BranchAdminFeedbackController::class, 'store']);
    Route::get('/cashier-my-feedbacks', [BranchAdminFeedbackController::class, 'getMyFeedbacks']);

    // ========== CASHIER BILLING SYSTEM ==========
    // All billing routes enforce branch isolation
    Route::middleware(['branch.isolation'])->group(function () {
        // Cashier Billing Dashboard
        Route::get('/cashier-billing/dashboard-stats', [CashierBillingController::class, 'getDashboardStats']);
        
        // Billing Transactions (POS)
        Route::post('/cashier-billing/transactions', [CashierBillingController::class, 'createTransaction']);
        Route::get('/cashier-billing/transactions', [CashierBillingController::class, 'getTransactions']);
        
        // Cash Entries (Cash In/Out)
        Route::post('/cashier-billing/cash-entries', [CashEntryController::class, 'createEntry']);
        Route::get('/cashier-billing/cash-entries', [CashEntryController::class, 'getEntries']);
        Route::get('/cashier-billing/cash-summary', [CashEntryController::class, 'getCashSummary']);
        
        // End of Day (EOD)
        Route::get('/cashier-billing/eod-summary', [EODController::class, 'getEODSummary']);
        Route::post('/cashier-billing/eod-submit', [EODController::class, 'submitEOD']);
        Route::get('/cashier-billing/eod-history', [EODController::class, 'getEODHistory']);

        // Sales Reports
        Route::get('/cashier-billing/sales-report', [CashierBillingController::class, 'getSalesReport']);
        Route::get('/cashier-billing/daily-sales-trend', [CashierBillingController::class, 'getDailySalesTrend']);
    });
});
