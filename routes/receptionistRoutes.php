<?php

use App\Http\Controllers\Receptionist\ReceptionistDashboardController;
use App\Http\Controllers\NotificationManagement\NotificationManagementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Receptionist Dashboard Routes
|--------------------------------------------------------------------------
|
| Here is where you can register receptionist-specific routes for the application.
| These routes are loaded by the RouteServiceProvider and are assigned
| the "api" middleware group with auth:sanctum and role:receptionist.
|
*/

Route::middleware(['auth:sanctum', 'role:receptionist'])->prefix('receptionist')->group(function () {
    
    // Dashboard
    Route::get('/dashboard-stats', [ReceptionistDashboardController::class, 'getDashboardStats']);
    
    // Branches
    Route::get('/branches', [ReceptionistDashboardController::class, 'getBranches']);
    
    // Patient Registration & Management
    Route::get('/patients', [ReceptionistDashboardController::class, 'getPatients']);
    Route::get('/patients/search', [ReceptionistDashboardController::class, 'searchPatients']);
    Route::post('/patients', [ReceptionistDashboardController::class, 'registerPatient']);
    Route::get('/patients/{patientId}', [ReceptionistDashboardController::class, 'getPatientDetails']);
    Route::put('/patients/{patientId}', [ReceptionistDashboardController::class, 'updatePatient']);
    
    // Appointment Management
    Route::get('/appointments', [ReceptionistDashboardController::class, 'getAppointments']);
    Route::post('/appointments', [ReceptionistDashboardController::class, 'createAppointment']);
    Route::get('/appointments/{appointmentId}', [ReceptionistDashboardController::class, 'getAppointmentDetails']);
    Route::put('/appointments/{appointmentId}', [ReceptionistDashboardController::class, 'updateAppointment']);
    Route::post('/appointments/{appointmentId}/cancel', [ReceptionistDashboardController::class, 'cancelAppointment']);
    Route::post('/appointments/{appointmentId}/reschedule', [ReceptionistDashboardController::class, 'rescheduleAppointment']);
    
    // Doctor availability
    Route::get('/doctors', [ReceptionistDashboardController::class, 'getDoctors']);
    Route::get('/doctors/{doctorId}/availability', [ReceptionistDashboardController::class, 'getDoctorAvailability']);
    Route::get('/departments', [ReceptionistDashboardController::class, 'getDepartments']);
    
    // Patient Queue & Token Management
    Route::get('/queue', [ReceptionistDashboardController::class, 'getQueue']);
    Route::post('/queue/token', [ReceptionistDashboardController::class, 'issueToken']);
    Route::put('/queue/{queueId}/status', [ReceptionistDashboardController::class, 'updateQueueStatus']);
    Route::get('/queue/stats', [ReceptionistDashboardController::class, 'getQueueStats']);
    
    // Visit & OPD Records
    Route::get('/visits', [ReceptionistDashboardController::class, 'getVisits']);
    Route::post('/visits', [ReceptionistDashboardController::class, 'createVisit']);
    Route::get('/visits/{visitId}', [ReceptionistDashboardController::class, 'getVisitDetails']);
    Route::put('/visits/{visitId}', [ReceptionistDashboardController::class, 'updateVisit']);
    Route::post('/visits/{visitId}/print-slip', [ReceptionistDashboardController::class, 'printVisitSlip']);
    
    // Notifications
    Route::get('/notifications/{user_id}', [NotificationManagementController::class, 'getNotificationByUserID']);
    Route::get('/notifications/unread-count/{user_id}', [NotificationManagementController::class, 'getUnreadCount']);
    Route::post('/notifications/mark-read', [NotificationManagementController::class, 'markNotificationsAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationManagementController::class, 'markAllAsRead']);
    Route::put('/notifications/{id}/read', [NotificationManagementController::class, 'markSingleNotificationAsRead']);
    Route::delete('/notifications/{id}', [NotificationManagementController::class, 'deleteNotification']);
    
    // Reports
    Route::get('/reports/daily-registrations', [ReceptionistDashboardController::class, 'getDailyRegistrationsReport']);
    Route::get('/reports/appointments', [ReceptionistDashboardController::class, 'getAppointmentsReport']);
    Route::get('/reports/no-shows', [ReceptionistDashboardController::class, 'getNoShowsReport']);
    Route::get('/reports/walk-ins', [ReceptionistDashboardController::class, 'getWalkInsReport']);
    
    // Profile
    Route::get('/profile', [ReceptionistDashboardController::class, 'getProfile']);
    Route::put('/profile', [ReceptionistDashboardController::class, 'updateProfile']);
    Route::put('/profile/password', [ReceptionistDashboardController::class, 'changePassword']);
});
