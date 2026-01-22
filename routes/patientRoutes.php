<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\PatientUserMiddleware;
use App\Http\Controllers\Users\UsersController;
use App\Http\Controllers\Users\PatientController;
use App\Http\Controllers\AppointmentSchedule\DoctorScheduleController;
use App\Http\Controllers\PatientAppointment\PatientAppointmentController;
use App\Http\Controllers\NotificationManagement\NotificationManagementController;
use App\Http\Controllers\BranchAdmin\BranchAdminFeedbackController;

Route::post('forgot-password', [PatientController::class, 'forgotPassword']);

// Sign out route - outside middleware so it works even with expired tokens
Route::post('sign-out-patient', [UsersController::class, 'userSignOut']);

Route::middleware(['auth:sanctum', PatientUserMiddleware::class])->group(function () {
    Route::post('/check-doctor-availability-user', [DoctorScheduleController::class, 'checkDoctorAvailability']);
    Route::get('/get-doctor-schedule', [DoctorScheduleController::class, 'getDoctorSchedule']);
    Route::get('/get-doctor-schedule-by-id', [DoctorScheduleController::class, 'getDoctorScheduleWithId']);
    Route::post('/create-patient-appointment', [PatientAppointmentController::class, 'createPatientAppointment']);

    Route::get('/get-patient-appointments/{user_id}', [PatientAppointmentController::class, 'getPatientAppointmentByUserID']);

    Route::put('/change-appointment-date/{user_id}', [PatientAppointmentController::class, 'changeAppointmentDate']);

    // Patient Notification Routes (specific routes first)
    Route::get('/patient/notifications/unread-count/{user_id}', [NotificationManagementController::class, 'getUnreadCount']);
    Route::post('/patient/notifications/mark-read', [NotificationManagementController::class, 'markNotificationsAsRead']);
    Route::delete('/patient/notifications/clear-read', [NotificationManagementController::class, 'clearReadNotifications']);
    Route::put('/patient/notifications/mark-all-read', [NotificationManagementController::class, 'markAllAsRead']);
    Route::put('/patient/notifications/{id}/read', [NotificationManagementController::class, 'markSingleNotificationAsRead']);
    Route::delete('/patient/notifications/{id}', [NotificationManagementController::class, 'deleteNotification']);
    Route::get('/patient/notifications/{user_id}', [NotificationManagementController::class, 'getNotificationByUserID']);

    // Patient Feedback Routes
    Route::get('/patient/my-feedbacks', [BranchAdminFeedbackController::class, 'getMyFeedbacks']);
});
