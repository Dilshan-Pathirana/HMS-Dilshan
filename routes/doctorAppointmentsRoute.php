<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\DoctorUserMiddleware;
use App\Http\Controllers\Users\DoctorController;
use App\Http\Controllers\DoctorSession\DoctorSessionController;
use App\Http\Controllers\PatienSessions\MainQuestionsController;
use App\Http\Controllers\PatientSession\QuestionAnswerController;
use App\Http\Controllers\AppointmentSchedule\DoctorScheduleController;
use App\Http\Controllers\DoctorScheduleCancel\DoctorScheduleCancelController;
use App\Http\Controllers\NotificationManagement\NotificationManagementController;
use App\Http\Controllers\Doctor\ScheduleModificationController;
use App\Http\Controllers\Doctor\DoctorConsultationController;

Route::middleware(['auth:sanctum', DoctorUserMiddleware::class])->group(function () {
    Route::get('/get-doctor-all-schedule/{user_id}', [DoctorController::class, 'getDoctorScheduleAll']);

    Route::get('/get-doctor-schedule-appointments/{user_id}/{branch_id}/{schedule_id}', [DoctorController::class, 'getDoctorScheduleAppointments']);
    Route::post('/cancel-doctor-appointments', [DoctorController::class, 'cancelDoctorAppointments']);
    Route::post('/request-cancel-doctor-appointment', [DoctorController::class, 'cancelSchedule']);
    Route::post('/cancel-doctor-entire-day', [DoctorController::class, 'cancelEntireDay']);

    // Doctor Schedule Management
    Route::post('/doctor-create-schedule', [DoctorScheduleController::class, 'createDoctorSchedule']);
    Route::put('/doctor-update-schedule/{id}', [DoctorScheduleController::class, 'updateDoctorSchedule']);
    Route::delete('/doctor-delete-schedule/{id}', [DoctorScheduleController::class, 'deleteDoctorSchedule']);

    // Doctor Schedule Request Management (Approval Workflow)
    Route::get('/get-doctor-schedule-requests/{doctor_id}', [DoctorScheduleController::class, 'getDoctorScheduleRequests']);
    Route::get('/get-schedule-request/{id}', [DoctorScheduleController::class, 'getScheduleRequestById']);
    Route::put('/update-doctor-schedule-request/{id}', [DoctorScheduleController::class, 'updateDoctorScheduleRequest']);
    Route::delete('/cancel-doctor-schedule-request/{doctor_id}/{id}', [DoctorScheduleController::class, 'cancelDoctorScheduleRequest']);

    // Doctor Notifications
    Route::get('/doctor/notifications/{userId}', [NotificationManagementController::class, 'getNotificationByUserID']);
    Route::get('/doctor/notifications/unread-count/{userId}', [NotificationManagementController::class, 'getUnreadCount']);
    Route::post('/doctor/notifications/mark-read', [NotificationManagementController::class, 'markNotificationsAsRead']);
    Route::put('/doctor/notifications/mark-all-read', [NotificationManagementController::class, 'markAllAsRead']);
    Route::put('/doctor/notifications/{id}/read', [NotificationManagementController::class, 'markSingleNotificationAsRead']);
    Route::delete('/doctor/notifications/{id}', [NotificationManagementController::class, 'deleteNotification']);

    Route::post('/add-main-question-doctor', [MainQuestionsController::class, 'addMainQuestion']);
    Route::get('/get-doctor-questions/{doctorId}', [MainQuestionsController::class, 'getDoctorQuestions']);
    Route::put('/update-doctor-main-question/{id}', [MainQuestionsController::class, 'updateMainQuestion']);
    Route::delete('/delete-doctor-main-question/{id}', [MainQuestionsController::class, 'deleteMainQuestion']);

    Route::get('/get-all-doctor-schedule/{doctor_id}', [DoctorScheduleController::class, 'getDoctorScheduleById']);
    Route::get('/get-doctor-schedule-cancel/{doctorId}', [DoctorScheduleCancelController::class, 'getCancellationsByDoctorId']);

    Route::post('/add-question-answer-doctor', [QuestionAnswerController::class, 'addNewAnswer']);
    Route::put('/update-question-answer-doctor/{id}', [QuestionAnswerController::class, 'updateQuestionAnswer']);
    Route::delete('/delete-question-answer-doctor/{id}', [QuestionAnswerController::class, 'deleteQuestionAnswer']);
    Route::get('/get-question-answers-doctor/{questionId}', [QuestionAnswerController::class, 'getAnswersByQuestionId']);

    Route::get('/doctor-sessions/{doctorId}', [DoctorSessionController::class, 'getDoctorSessionsByDoctor']);
    
    // Schedule Modification Requests (Block dates, delay start, limit appointments, etc.)
    Route::get('/schedule-modifications/{doctor_id}', [ScheduleModificationController::class, 'getModificationRequests']);
    Route::get('/schedule-modification/{id}', [ScheduleModificationController::class, 'getModificationRequest']);
    Route::post('/schedule-modifications', [ScheduleModificationController::class, 'createModificationRequest']);
    Route::put('/schedule-modifications/{id}', [ScheduleModificationController::class, 'updateModificationRequest']);
    Route::delete('/schedule-modifications/{id}', [ScheduleModificationController::class, 'deleteModificationRequest']);

    // =====================================
    // DOCTOR CONSULTATION MODULE ROUTES
    // =====================================
    
    // Queue Management
    Route::get('/consultation/queue/{doctorId}', [DoctorConsultationController::class, 'getTodayQueue']);
    Route::get('/consultation/appointments/{doctorId}/{date}', [DoctorConsultationController::class, 'getAppointmentsByDate']);
    
    // Patient Overview (read-only)
    Route::get('/consultation/patient/{patientId}', [DoctorConsultationController::class, 'getPatientOverview']);
    
    // Consultation Management
    Route::post('/consultation/start', [DoctorConsultationController::class, 'startConsultation']);
    Route::get('/consultation/{consultationId}', [DoctorConsultationController::class, 'getConsultation']);
    Route::post('/consultation/{consultationId}/submit', [DoctorConsultationController::class, 'submitConsultation']);
    
    // Question Bank
    Route::get('/consultation/questions/bank', [DoctorConsultationController::class, 'getQuestionBank']);
    Route::post('/consultation/{consultationId}/questions', [DoctorConsultationController::class, 'saveQuestions']);
    
    // Diagnoses
    Route::get('/consultation/diagnoses/list', [DoctorConsultationController::class, 'getDiagnoses']);
    Route::post('/consultation/diagnoses/add', [DoctorConsultationController::class, 'addDiagnosis']);
    Route::post('/consultation/{consultationId}/diagnoses', [DoctorConsultationController::class, 'saveDiagnoses']);
    
    // Medicines (read-only inventory)
    Route::get('/consultation/medicines/list', [DoctorConsultationController::class, 'getMedicines']);
    Route::post('/consultation/{consultationId}/prescriptions', [DoctorConsultationController::class, 'savePrescriptions']);
    
    // Audit Log
    Route::get('/consultation/{consultationId}/audit', [DoctorConsultationController::class, 'getAuditLog']);
});

// Cashier and Pharmacist routes (different middleware)
Route::middleware(['auth:sanctum'])->group(function () {
    // Cashier: Get pending consultations for billing
    Route::get('/cashier/consultations/pending', [DoctorConsultationController::class, 'getPendingForCashier']);
    Route::post('/cashier/consultations/{consultationId}/payment', [DoctorConsultationController::class, 'processPayment']);
    
    // Pharmacist: Get paid consultations for medicine dispensing
    Route::get('/pharmacist/consultations/pending', [DoctorConsultationController::class, 'getPendingForPharmacist']);
    Route::post('/pharmacist/consultations/{consultationId}/dispense', [DoctorConsultationController::class, 'issueMedicines']);
});
