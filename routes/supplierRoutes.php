<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Supplier\SupplierDashboardController;
use App\Http\Controllers\Supplier\SupplierOrderController;
use App\Http\Controllers\Supplier\SupplierProductController;

/*
|--------------------------------------------------------------------------
| Supplier Entity Routes
|--------------------------------------------------------------------------
|
| Here are routes for supplier entity users who have external supplier access
|
*/

Route::middleware(['auth:sanctum'])->group(function () {
    
    // Supplier Dashboard
    Route::get('/supplier/dashboard', [SupplierDashboardController::class, 'index']);
    Route::get('/supplier/profile', [SupplierDashboardController::class, 'profile']);
    Route::put('/supplier/profile/update', [SupplierDashboardController::class, 'updateProfile']);
    
    // Supplier Orders
    Route::get('/supplier/orders', [SupplierOrderController::class, 'index']);
    Route::get('/supplier/orders/{id}', [SupplierOrderController::class, 'show']);
    Route::put('/supplier/orders/{id}/status', [SupplierOrderController::class, 'updateStatus']);
    
    // Supplier Products
    Route::get('/supplier/products', [SupplierProductController::class, 'index']);
    Route::post('/supplier/products', [SupplierProductController::class, 'store']);
    Route::put('/supplier/products/{id}', [SupplierProductController::class, 'update']);
    Route::get('/supplier/products/{id}', [SupplierProductController::class, 'show']);
    
});
