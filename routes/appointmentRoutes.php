<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Appointment\AppointmentBookingController;
use App\Http\Controllers\Appointment\DoctorAppointmentController;
use App\Http\Controllers\Appointment\ReceptionistAppointmentController;
use App\Http\Controllers\Appointment\BranchAdminAppointmentController;
use App\Http\Controllers\Appointment\SuperAdminAppointmentController;

/*
|--------------------------------------------------------------------------
| Appointment Booking Routes
|--------------------------------------------------------------------------
|
| This file contains all routes related to appointment booking and management
| for patients, doctors, receptionists, branch admins, and super admins.
|
*/

// ========================================
// Public Routes (No Authentication Required)
// ========================================
Route::prefix('appointments')->group(function () {
    // Get available branches for booking
    Route::get('/branches', [AppointmentBookingController::class, 'getBranches']);

    // Get Sri Lanka cities
    Route::get('/cities', [AppointmentBookingController::class, 'getCities']);

    // Get available specializations
    Route::get('/specializations', [AppointmentBookingController::class, 'getSpecializations']);

    // Search doctors (public for discovery)
    Route::get('/doctors/search', [AppointmentBookingController::class, 'searchDoctors']);

    // Get all schedules for a specific doctor (for reschedule branch selection)
    Route::get('/doctors/{doctorId}/schedules', [AppointmentBookingController::class, 'getDoctorSchedules']);

    // Get available slots for a doctor
    Route::get('/doctors/{doctorId}/slots', [AppointmentBookingController::class, 'getAvailableSlots']);

    // Get slots with time estimates
    Route::post('/doctors/slots-with-times', [AppointmentBookingController::class, 'getSlotsWithTimeEstimates']);
});

// ========================================
// Patient Routes (Authenticated Patients)
// ========================================
Route::prefix('patient/appointments')->middleware(['auth:sanctum'])->group(function () {
    // Check for duplicate appointments before booking
    Route::post('/check-duplicate', [AppointmentBookingController::class, 'checkDuplicateAppointment']);

    // Create a new appointment booking
    Route::post('/book', [AppointmentBookingController::class, 'createBooking']);

    // Prepare PayHere payment for a booking
    Route::post('/{bookingId}/prepare-payment', [AppointmentBookingController::class, 'preparePayHerePayment']);

    // Confirm payment for a booking
    Route::post('/{bookingId}/confirm-payment', [AppointmentBookingController::class, 'confirmPayment']);

    // Get patient's own appointments
    Route::get('/my-appointments', [AppointmentBookingController::class, 'getPatientAppointments']);

    // Get appointment details
    Route::get('/{bookingId}', [AppointmentBookingController::class, 'getAppointmentDetails']);

    // Cancel an appointment
    Route::post('/{bookingId}/cancel', [AppointmentBookingController::class, 'cancelAppointment']);

    // Check reschedule eligibility (24-hour rule, attempt limits)
    Route::get('/{bookingId}/reschedule-eligibility', [AppointmentBookingController::class, 'getRescheduleEligibility']);

    // Reschedule an appointment
    Route::post('/{bookingId}/reschedule', [AppointmentBookingController::class, 'rescheduleAppointment']);
});

// ========================================
// Doctor Routes (Authenticated Doctors)
// ========================================
Route::prefix('doctor/appointments')->middleware(['auth:sanctum'])->group(function () {
    // Get doctor's appointments (with optional date filter)
    Route::get('/', [DoctorAppointmentController::class, 'getAppointments']);

    // Get today's queue
    Route::get('/today-queue', [DoctorAppointmentController::class, 'getTodaysQueue']);

    // Get appointment statistics
    Route::get('/statistics', [DoctorAppointmentController::class, 'getStatistics']);

    // Check in a patient
    Route::post('/{bookingId}/check-in', [DoctorAppointmentController::class, 'checkInPatient']);

    // Start consultation session
    Route::post('/{bookingId}/start-session', [DoctorAppointmentController::class, 'startSession']);

    // Complete consultation
    Route::post('/{bookingId}/complete', [DoctorAppointmentController::class, 'completeConsultation']);

    // Mark patient as no-show
    Route::post('/{bookingId}/no-show', [DoctorAppointmentController::class, 'markNoShow']);
});

// ========================================
// Receptionist Routes (Authenticated Receptionists/Cashiers)
// ========================================
Route::prefix('receptionist/appointments')->middleware(['auth:sanctum'])->group(function () {
    // Create walk-in booking
    Route::post('/walk-in', [ReceptionistAppointmentController::class, 'createWalkInBooking']);

    // Get appointments for reception
    Route::get('/', [ReceptionistAppointmentController::class, 'getAppointments']);

    // Search patients
    Route::get('/patients/search', [ReceptionistAppointmentController::class, 'searchPatients']);

    // Get available doctors
    Route::get('/doctors/available', [ReceptionistAppointmentController::class, 'getAvailableDoctors']);

    // Check in a patient
    Route::post('/{bookingId}/check-in', [ReceptionistAppointmentController::class, 'checkInPatient']);

    // Cancel an appointment
    Route::post('/{bookingId}/cancel', [ReceptionistAppointmentController::class, 'cancelAppointment']);

    // Record payment
    Route::post('/{bookingId}/payment', [ReceptionistAppointmentController::class, 'recordPayment']);
});

// ========================================
// Branch Admin Routes
// ========================================
Route::prefix('branch-admin/appointments')->middleware(['auth:sanctum'])->group(function () {
    // Dashboard with alerts and summary
    Route::get('/dashboard', [BranchAdminAppointmentController::class, 'getDashboard']);

    // Get all appointments in branch
    Route::get('/', [BranchAdminAppointmentController::class, 'getAppointments']);

    // Get appointment statistics
    Route::get('/statistics', [BranchAdminAppointmentController::class, 'getStatistics']);

    // Get doctors in branch
    Route::get('/doctors', [BranchAdminAppointmentController::class, 'getDoctors']);

    // Get specializations available in branch
    Route::get('/specializations', [BranchAdminAppointmentController::class, 'getSpecializations']);

    // Search patients for booking
    Route::get('/patients/search', [BranchAdminAppointmentController::class, 'searchPatients']);

    // Get available slots for a doctor on a date
    Route::get('/available-slots', [BranchAdminAppointmentController::class, 'getAvailableSlots']);

    // Appointment settings management (MUST be before {bookingId} routes!)
    Route::get('/settings', [BranchAdminAppointmentController::class, 'getSettings']);
    Route::put('/settings', [BranchAdminAppointmentController::class, 'updateSettings']);

    // Create appointment on behalf of patient
    Route::post('/create', [BranchAdminAppointmentController::class, 'createAppointment']);

    // Register new patient for walk-in/phone booking (auto-generates credentials)
    Route::post('/register-patient', [BranchAdminAppointmentController::class, 'registerPatientForAppointment']);

    // Create appointment with new patient registration in one call
    Route::post('/create-with-patient', [BranchAdminAppointmentController::class, 'createAppointmentWithPatient']);

    // Update payment status for an appointment
    Route::post('/{bookingId}/payment', [BranchAdminAppointmentController::class, 'updatePaymentStatus']);

    // Get single appointment details
    Route::get('/{bookingId}/details', [BranchAdminAppointmentController::class, 'getAppointmentDetails']);

    // Modify an appointment
    Route::put('/{bookingId}', [BranchAdminAppointmentController::class, 'modifyAppointment']);

    // Update appointment status
    Route::post('/{bookingId}/status', [BranchAdminAppointmentController::class, 'updateStatus']);

    // Admin reschedule appointment (no restrictions)
    Route::post('/{bookingId}/reschedule', [BranchAdminAppointmentController::class, 'rescheduleAppointment']);

    // Cancel an appointment
    Route::post('/{bookingId}/cancel', [BranchAdminAppointmentController::class, 'cancelAppointment']);

    // Get appointment logs (for single appointment)
    Route::get('/{bookingId}/logs', [BranchAdminAppointmentController::class, 'getAppointmentLogs']);

    // Get branch-wide audit logs (with filtering)
    Route::get('/audit-logs', [BranchAdminAppointmentController::class, 'getBranchAuditLogs']);
});

// ========================================
// Super Admin Routes
// ========================================
Route::prefix('super-admin/appointments')->middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    // Get all appointments (cross-branch)
    Route::get('/', [SuperAdminAppointmentController::class, 'getAllAppointments']);

    // Get global statistics
    Route::get('/statistics', [SuperAdminAppointmentController::class, 'getGlobalStatistics']);

    // Get all branches
    Route::get('/branches', [SuperAdminAppointmentController::class, 'getBranches']);

    // Get all doctors
    Route::get('/doctors', [SuperAdminAppointmentController::class, 'getAllDoctors']);

    // Get available slots
    Route::get('/available-slots', [SuperAdminAppointmentController::class, 'getAvailableSlots']);

    // Search patients (cross-branch)
    Route::get('/search-patients', [SuperAdminAppointmentController::class, 'searchPatients']);

    // Create appointment
    Route::post('/create', [SuperAdminAppointmentController::class, 'createAppointment']);
    Route::post('/create-with-patient', [SuperAdminAppointmentController::class, 'createAppointmentWithPatient']);

    // Appointment actions
    Route::post('/{bookingId}/cancel', [SuperAdminAppointmentController::class, 'cancelAppointment']);
    Route::post('/{bookingId}/reschedule', [SuperAdminAppointmentController::class, 'rescheduleAppointment']);
    Route::post('/{bookingId}/status', [SuperAdminAppointmentController::class, 'updateStatus']);

    // Get audit logs
    Route::get('/audit-logs', [SuperAdminAppointmentController::class, 'getAuditLogs']);

    // Branch settings management
    Route::get('/branch-settings', [SuperAdminAppointmentController::class, 'getBranchSettings']);
    Route::put('/branch-settings/{branchId}', [SuperAdminAppointmentController::class, 'updateBranchSettings']);

    // System-wide settings (booking fee, etc.) - Super Admin only
    Route::get('/system-settings', [SuperAdminAppointmentController::class, 'getSystemSettings']);
    Route::put('/system-settings', [SuperAdminAppointmentController::class, 'updateSystemSettings']);
});
