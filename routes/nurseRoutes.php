<?php

use App\Http\Controllers\Nurse\NurseDashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Nurse Dashboard Routes
|--------------------------------------------------------------------------
|
| Here is where you can register nurse-specific routes for the application.
| These routes are loaded by the RouteServiceProvider and are assigned
| the "api" middleware group with auth:sanctum and role:nurse.
|
*/

// Helper function to validate nurse token manually
$validateNurseToken = function () {
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
    
    // Check if user is a nurse (role_as = 7 based on database values)
    // Note: The database has nurse users with role_as=7, not 5
    if ($user->role_as != 7) {
        return ['error' => response()->json(['message' => 'Unauthorized. User is not a nurse', 'role_as' => $user->role_as], 403)];
    }
    
    // Set the user for Auth facade
    auth()->setUser($user);
    
    return ['user' => $user];
};

// Routes without middleware - manual token validation
Route::prefix('nurse')->group(function () use ($validateNurseToken) {
    
    // Dashboard
    Route::get('/dashboard-stats', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getDashboardStats();
    });
    
    // Patients
    Route::get('/patients', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getPatients(request());
    });
    
    Route::get('/patients/all', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getAllPatients(request());
    });
    
    Route::get('/patients/{patientId}', function ($patientId) use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getPatientDetails($patientId);
    });
    
    // Vital Signs
    Route::get('/vital-signs', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getVitalSigns(request());
    });
    
    Route::post('/vital-signs', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->recordVitalSigns(request());
    });
    
    Route::put('/vital-signs/{id}', function ($id) use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->updateVitalSigns(request(), $id);
    });
    
    // Shifts
    Route::get('/shifts', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getShifts(request());
    });
    
    Route::get('/shifts/current', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getCurrentShift();
    });
    
    Route::post('/shifts/{shiftId}/start', function ($shiftId) use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->startShift($shiftId);
    });
    
    Route::post('/shifts/{shiftId}/end', function ($shiftId) use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->endShift(request(), $shiftId);
    });
    
    // Handovers
    Route::get('/handovers', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getHandovers(request());
    });
    
    Route::post('/handovers', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->createHandover(request());
    });
    
    Route::post('/handovers/{handoverId}/acknowledge', function ($handoverId) use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->acknowledgeHandover($handoverId);
    });
    
    // Profile
    Route::get('/profile', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getProfile();
    });
    
    Route::put('/profile', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->updateProfile(request());
    });
    
    Route::put('/profile/password', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->changePassword(request());
    });
    
    // Utilities
    Route::get('/wards', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getWards();
    });
    
    Route::get('/nurses-list', function () use ($validateNurseToken) {
        $result = $validateNurseToken();
        if (isset($result['error'])) return $result['error'];
        return app(NurseDashboardController::class)->getNurses();
    });
});
