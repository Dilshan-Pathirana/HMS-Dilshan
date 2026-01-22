<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Users\UsersController;
use App\Http\Controllers\Users\AllUserController;
use App\Http\Controllers\Users\PatientController;
use App\Http\Middleware\PharmacistUserMiddleware;
use App\Http\Controllers\Shift\ShiftManagementController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\Pharmacy\Product\ProductController;
use App\Http\Controllers\Pharmacy\Supplier\SupplierController;
use App\Http\Controllers\Pharmacy\Product\ProductStockController;
use App\Http\Controllers\Pharmacy\Purchasing\PurchasingController;
use App\Http\Controllers\Pharmacy\DashboardPOS\DashboardController;
use App\Http\Controllers\LeavesManagement\LeavesManagementController;
use App\Http\Controllers\NotificationManagement\NotificationManagementController;
use App\Http\Controllers\BranchAdmin\BranchAdminFeedbackController;

Route::middleware(['auth:sanctum', PharmacistUserMiddleware::class])->group(function () {
    Route::post('sign-out-pharmacist', [UsersController::class, 'userSignOut']);

    // Products
    Route::post('/pharmacist-user-create-product', [ProductController::class, 'addProduct']);
    Route::get('/pharmacist-user-get-products', [ProductController::class, 'getProductsDetails']);
    Route::get('/pharmacist-get-product-item-name', [ProductController::class, 'getProductItemNameAndCode']);
    Route::post('/pharmacist-update-product/{productId}', [ProductController::class, 'updateProduct']);

    // PharmacyPOS Dashboard
    Route::get('/pharmacist-user-dashboard-details', [DashboardController::class, 'getDashboardDetails']);

    // Product Stock
    Route::post('/pharmacist-update-product-stock', [ProductStockController::class, 'updateProductStock']);
    Route::post('/pharmacist-add-product-damaged-stock', [ProductStockController::class, 'reduceProductDamagedStock']);
    Route::post('/pharmacist-add-product-transfer-stock', [ProductStockController::class, 'reduceProductTransferStock']);
    Route::get('/pharmacist-get-damaged-product', [ProductStockController::class, 'getProductDamagedStock']);
    Route::get('/pharmacist-get-transfer-product', [ProductStockController::class, 'getProductTransferStock']);
    Route::get('/pharmacist-get-product-renewed-stock', [ProductStockController::class, 'getProductRenewStock']);

    Route::post('/pharmacist-user-purchasing-product', [PurchasingController::class, 'addPurchasing']);
    Route::get('/pharmacist-user-get-purchasing-products', [PurchasingController::class, 'getPurchasingDetails']);
    Route::get('/pharmacist-user-fetch-purchasing-details', [PurchasingController::class, 'fetchPurchasingDetails']);

    //Shift
    Route::get('/get-all-pharmacist-user-shifts/{user_id}', [ShiftManagementController::class, 'getAllShiftsUserID']);

    // pharmacist Leaves management
    Route::post('/pharmacist-user-add-leave', [LeavesManagementController::class, 'addLeaves']);
    Route::get('/get-pharmacist-user-leaves/{user_id}', [LeavesManagementController::class, 'getLeavesByUserID']);

    // pharmacist Leaves Request
    Route::get('/get-pharmacist-user-leaves-request/{assigner_id}', [LeavesManagementController::class, 'getLeavesByAssignerID']);
    Route::post('/pharmacist-user-leave-approve', [LeavesManagementController::class, 'leaveApprove']);
    Route::post('/pharmacist-user-leave-reject', [LeavesManagementController::class, 'leaveReject']);

    //AllUser
    Route::get('/pharmacist-get-all-users', [AllUserController::class, 'getAllUsers']);

    //Notification
    Route::get('/get-pharmacist-user-notifications/{user_id}', [NotificationManagementController::class, 'getNotificationByUserID']);
    Route::post('/pharmacist-user-notifications/mark-read', [NotificationManagementController::class, 'markNotificationsAsRead']);

    // Supplier
    Route::post('/create-pharmacist-supplier', [SupplierController::class, 'addSupplier']);
    Route::get('/get-pharmacist-suppliers', [SupplierController::class, 'getSupplierDetails']);

    // Patients
    Route::get('get-pharmacist-patients-details', [PatientController::class, 'getPatientsDetails']);

    // Purchase Requests
    Route::get('/purchase-requests', [PurchaseRequestController::class, 'index']);
    Route::post('/purchase-requests', [PurchaseRequestController::class, 'store']);
    Route::get('/purchase-requests/stats', [PurchaseRequestController::class, 'getStats']);
    Route::get('/purchase-requests/search-items', [PurchaseRequestController::class, 'searchItems']); // Advanced item search
    Route::get('/purchase-requests/clarification-count', [PurchaseRequestController::class, 'getClarificationCount']); // Clarification badge
    Route::get('/purchase-requests/clarification-requests', [PurchaseRequestController::class, 'getClarificationRequests']); // PRs needing clarification
    Route::get('/purchase-requests/{id}', [PurchaseRequestController::class, 'show']);
    Route::put('/purchase-requests/{id}', [PurchaseRequestController::class, 'update']);
    Route::post('/purchase-requests/{id}/submit', [PurchaseRequestController::class, 'submit']);
    Route::post('/purchase-requests/{id}/resubmit', [PurchaseRequestController::class, 'resubmitAfterClarification']); // Resubmit after clarification
    Route::delete('/purchase-requests/{id}', [PurchaseRequestController::class, 'destroy']);

    // Feedback Management
    Route::post('/submit-feedback', [BranchAdminFeedbackController::class, 'store']);
    Route::get('/pharmacist-my-feedbacks', [BranchAdminFeedbackController::class, 'getMyFeedbacks']);
});
