<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Users\DoctorController;
use App\Http\Controllers\Users\PatientController;
use App\Http\Controllers\WebSite\WebSiteController;
use App\Http\Controllers\Hospital\Branch\BranchController;

Route::get('/get-doctor-schedules', [WebSiteController::class, 'getDoctorSchedules']);
Route::get('/get-doctors', [DoctorController::class, 'getDoctorsDetails']);
Route::get('/get-branches', [BranchController::class, 'getBranches']);

//Patient
Route::post('/create-patient', [PatientController::class, 'createPatient']);

// NOTE: Removed SPA fallback routes from here - they should only be in web.php
// The routes in this file are included from api.php with /api prefix
// Having a fallback here would catch all API routes
