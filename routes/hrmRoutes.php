<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HRM\HRMController;
use App\Http\Controllers\HRM\HRMLeaveController;
use App\Http\Controllers\HRM\HRMOvertimeController;
use App\Http\Controllers\HRM\HRMPayslipController;
use App\Http\Controllers\HRM\HRMShiftController;
use App\Http\Controllers\HRM\HRMAttendanceController;
use App\Http\Controllers\HRM\HRMSalaryIncrementController;
use App\Http\Controllers\HRM\HRMDeductionController;
use App\Http\Controllers\HRM\HRMLetterController;
use App\Http\Controllers\HRM\HRMComplaintController;
use App\Http\Controllers\HRM\HRMAnalyticsController;
use App\Http\Controllers\HRM\HRMAuditLogController;
use App\Http\Controllers\HRM\HRPolicyController;
use App\Http\Controllers\HRM\SalaryStructureController;
use App\Http\Controllers\HRM\LeaveTypeController;
use App\Http\Controllers\HRM\ShiftTemplateController;
use App\Http\Controllers\HRM\EPFETFConfigController;
use App\Http\Controllers\HRM\PayrollConfigController;
use App\Http\Controllers\HRM\CashierHRController;

/*
|--------------------------------------------------------------------------
| HRM Module Routes
|--------------------------------------------------------------------------
| Sri Lanka Compliant HRM System
| - EPF: 8% Employee + 12% Employer
| - ETF: 3% Employer
|--------------------------------------------------------------------------
*/

// HRM Routes (Protected - Token validation done in controllers)
Route::prefix('hrm')->group(function () {
    
    // =============================================
    // Super Admin HRM Routes
    // =============================================
    Route::prefix('super-admin')->group(function () {
        // Dashboard stats
        Route::get('/stats', [HRMController::class, 'getSuperAdminStats']);
        
        // All staff across branches - list, view, update, export
        Route::get('/staff', [HRMController::class, 'getBranchStaff']);
        Route::get('/staff/export', [HRMController::class, 'exportStaffData']);
        Route::get('/staff/{id}', [HRMController::class, 'getStaffProfile']);
        Route::put('/staff/{id}', [HRMController::class, 'updateStaffProfile']);
        
        // Leave management
        Route::get('/pending-leaves', [HRMLeaveController::class, 'getPendingLeaves']);
        Route::put('/leave/{id}/approve', [HRMLeaveController::class, 'approveLeave']);
        
        // Overtime management
        Route::get('/overtime', [HRMOvertimeController::class, 'getBranchOvertime']);
        Route::post('/overtime', [HRMOvertimeController::class, 'recordOvertime']);
        Route::delete('/overtime/{id}', [HRMOvertimeController::class, 'deleteOvertime']);
        
        // Payroll
        Route::get('/payroll', [HRMPayslipController::class, 'getBranchPayroll']);
        Route::post('/generate-payslips', [HRMPayslipController::class, 'generatePayslips']);
        
        // Shifts
        Route::get('/shifts', [HRMShiftController::class, 'getShiftDefinitions']);
        Route::post('/shifts', [HRMShiftController::class, 'createShift']);
        Route::get('/shift-schedule', [HRMShiftController::class, 'getBranchShiftSchedule']);
        Route::post('/assign-shift', [HRMShiftController::class, 'assignShift']);
        
        // Attendance
        Route::get('/attendance', [HRMAttendanceController::class, 'getBranchAttendance']);
        Route::post('/attendance', [HRMAttendanceController::class, 'recordAttendance']);
        Route::get('/attendance-report', [HRMAttendanceController::class, 'getAttendanceReport']);
        
        // HR Policies
        Route::get('/policies', [HRPolicyController::class, 'index']);
        Route::get('/policies/stats', [HRPolicyController::class, 'getStats']);
        Route::post('/policies/copy-to-branch', [HRPolicyController::class, 'copyToBranch']);
        Route::get('/policies/{id}', [HRPolicyController::class, 'show']);
        Route::post('/policies', [HRPolicyController::class, 'store']);
        Route::put('/policies/{id}', [HRPolicyController::class, 'update']);
        Route::delete('/policies/{id}', [HRPolicyController::class, 'destroy']);
        
        // Salary Structures
        Route::get('/salary-structures/branches', [SalaryStructureController::class, 'getBranches']);
        Route::get('/salary-structures', [SalaryStructureController::class, 'index']);
        Route::get('/salary-structures/stats', [SalaryStructureController::class, 'getStats']);
        Route::get('/salary-structures/dropdown', [SalaryStructureController::class, 'getForDropdown']);
        Route::post('/salary-structures/copy-to-branch', [SalaryStructureController::class, 'copyToBranch']);
        Route::get('/salary-structures/{id}', [SalaryStructureController::class, 'show']);
        Route::post('/salary-structures', [SalaryStructureController::class, 'store']);
        Route::put('/salary-structures/{id}', [SalaryStructureController::class, 'update']);
        Route::delete('/salary-structures/{id}', [SalaryStructureController::class, 'destroy']);
        
        // EPF/ETF Configuration
        Route::get('/epf-etf-config', [EPFETFConfigController::class, 'getConfig']);
        Route::get('/epf-etf-config/all', [EPFETFConfigController::class, 'getAllConfigs']);
        Route::post('/epf-etf-config', [EPFETFConfigController::class, 'saveConfig']);
        Route::post('/epf-etf-config/calculate', [EPFETFConfigController::class, 'calculatePreview']);
        Route::get('/epf-etf-config/history', [EPFETFConfigController::class, 'getRateHistory']);
        Route::post('/epf-etf-config/reset', [EPFETFConfigController::class, 'resetToDefault']);
        
        // Payroll Configuration
        Route::get('/payroll-config', [PayrollConfigController::class, 'getConfig']);
        Route::get('/payroll-config/all', [PayrollConfigController::class, 'getAllConfigs']);
        Route::get('/payroll-config/stats', [PayrollConfigController::class, 'getStats']);
        Route::post('/payroll-config', [PayrollConfigController::class, 'saveConfig']);
        Route::post('/payroll-config/calculate', [PayrollConfigController::class, 'calculatePreview']);
        Route::post('/payroll-config/copy-to-branch', [PayrollConfigController::class, 'copyToBranch']);
        Route::post('/payroll-config/reset', [PayrollConfigController::class, 'resetToDefault']);
        
        // Leave Types Configuration
        Route::get('/leave-types', [LeaveTypeController::class, 'index']);
        Route::get('/leave-types/stats', [LeaveTypeController::class, 'getStats']);
        Route::post('/leave-types/initialize', [LeaveTypeController::class, 'initialize']);
        Route::post('/leave-types/copy-to-branch', [LeaveTypeController::class, 'copyToBranch']);
        Route::get('/leave-types/{id}', [LeaveTypeController::class, 'show']);
        Route::post('/leave-types', [LeaveTypeController::class, 'store']);
        Route::put('/leave-types/{id}', [LeaveTypeController::class, 'update']);
        Route::delete('/leave-types/{id}', [LeaveTypeController::class, 'destroy']);
        
        // Shift Templates Configuration
        Route::get('/shift-templates', [ShiftTemplateController::class, 'index']);
        Route::get('/shift-templates/stats', [ShiftTemplateController::class, 'getStats']);
        Route::get('/shift-templates/dropdown', [ShiftTemplateController::class, 'getForDropdown']);
        Route::post('/shift-templates/initialize', [ShiftTemplateController::class, 'initialize']);
        Route::post('/shift-templates/copy-to-branch', [ShiftTemplateController::class, 'copyToBranch']);
        Route::get('/shift-templates/{id}', [ShiftTemplateController::class, 'show']);
        Route::post('/shift-templates', [ShiftTemplateController::class, 'store']);
        Route::put('/shift-templates/{id}', [ShiftTemplateController::class, 'update']);
        Route::delete('/shift-templates/{id}', [ShiftTemplateController::class, 'destroy']);
        
        // Salary Increments (STEP 14)
        Route::get('/increments', [HRMSalaryIncrementController::class, 'getPendingIncrements']);
        Route::get('/increments/stats', [HRMSalaryIncrementController::class, 'getIncrementStats']);
        Route::post('/increments', [HRMSalaryIncrementController::class, 'createIncrement']);
        Route::put('/increments/{id}/approve', [HRMSalaryIncrementController::class, 'approveIncrement']);
        Route::put('/increments/{id}/reject', [HRMSalaryIncrementController::class, 'rejectIncrement']);
        
        // Deductions (STEP 15)
        Route::get('/deduction-types', [HRMDeductionController::class, 'getDeductionTypes']);
        Route::get('/deductions', [HRMDeductionController::class, 'getActiveDeductionsForPayroll']);
        Route::get('/deductions/stats', [HRMDeductionController::class, 'getDeductionStats']);
        Route::post('/deductions', [HRMDeductionController::class, 'createDeduction']);
        Route::put('/deductions/{id}/status', [HRMDeductionController::class, 'updateDeductionStatus']);
        Route::post('/deductions/{id}/transaction', [HRMDeductionController::class, 'recordDeductionTransaction']);
        
        // HR Letters (STEP 16 & 17)
        Route::get('/letter-templates', [HRMLetterController::class, 'getLetterTemplates']);
        Route::get('/letter-requests', [HRMLetterController::class, 'getPendingRequests']);
        Route::get('/letter-requests/stats', [HRMLetterController::class, 'getLetterStats']);
        Route::put('/letter-requests/{id}/process', [HRMLetterController::class, 'processRequest']);
        Route::put('/letter-requests/{id}/collected', [HRMLetterController::class, 'markCollected']);
        
        // HR Complaints (STEP 18)
        Route::get('/complaints', [HRMComplaintController::class, 'getAllComplaints']);
        Route::get('/complaints/stats', [HRMComplaintController::class, 'getComplaintStats']);
        Route::get('/complaints/{id}', [HRMComplaintController::class, 'getComplaintDetails']);
        Route::put('/complaints/{id}/status', [HRMComplaintController::class, 'updateStatus']);
        Route::put('/complaints/{id}/assign', [HRMComplaintController::class, 'assignComplaint']);
        Route::post('/complaints/{id}/comment', [HRMComplaintController::class, 'addComment']);
        
        // HR Analytics (STEP 19)
        Route::get('/analytics/dashboard', [HRMAnalyticsController::class, 'getDashboardSummary']);
        Route::get('/analytics/workforce', [HRMAnalyticsController::class, 'getWorkforceAnalytics']);
        Route::get('/analytics/attendance', [HRMAnalyticsController::class, 'getAttendanceAnalytics']);
        Route::get('/analytics/leave', [HRMAnalyticsController::class, 'getLeaveAnalytics']);
        Route::get('/analytics/payroll', [HRMAnalyticsController::class, 'getPayrollAnalytics']);
        Route::get('/analytics/turnover', [HRMAnalyticsController::class, 'getTurnoverAnalytics']);
        Route::get('/analytics/overtime', [HRMAnalyticsController::class, 'getOvertimeAnalytics']);
        
        // HR Audit Logs (STEP 20)
        Route::get('/audit-logs', [HRMAuditLogController::class, 'index']);
        Route::get('/audit-logs/stats', [HRMAuditLogController::class, 'getStats']);
        Route::get('/audit-logs/filters', [HRMAuditLogController::class, 'getFilterOptions']);
        Route::get('/audit-logs/export', [HRMAuditLogController::class, 'export']);
        Route::get('/audit-logs/user/{userId}', [HRMAuditLogController::class, 'getUserTimeline']);
        Route::get('/audit-logs/{id}', [HRMAuditLogController::class, 'show']);
    });
    
    // =============================================
    // Branch Admin HRM Routes
    // =============================================
    Route::prefix('branch-admin')->group(function () {
        // Dashboard stats
        Route::get('/stats', [HRMController::class, 'getBranchAdminStats']);
        
        // Staff management - list, view, update, export
        Route::get('/staff', [HRMController::class, 'getBranchStaff']);
        Route::get('/staff/export', [HRMController::class, 'exportStaffData']);
        Route::get('/staff/{id}', [HRMController::class, 'getStaffProfile']);
        Route::put('/staff/{id}', [HRMController::class, 'updateStaffProfile']);
        
        // Leave management
        Route::get('/pending-leaves', [HRMLeaveController::class, 'getPendingLeaves']);
        Route::put('/leave/{id}/approve', [HRMLeaveController::class, 'approveLeave']);
        
        // Overtime management
        Route::get('/overtime', [HRMOvertimeController::class, 'getBranchOvertime']);
        Route::post('/overtime', [HRMOvertimeController::class, 'recordOvertime']);
        Route::delete('/overtime/{id}', [HRMOvertimeController::class, 'deleteOvertime']);
        
        // Payroll
        Route::get('/payroll', [HRMPayslipController::class, 'getBranchPayroll']);
        Route::post('/generate-payslips', [HRMPayslipController::class, 'generatePayslips']);
        
        // Shifts
        Route::get('/shifts', [HRMShiftController::class, 'getShiftDefinitions']);
        Route::post('/shifts', [HRMShiftController::class, 'createShift']);
        Route::get('/shift-schedule', [HRMShiftController::class, 'getBranchShiftSchedule']);
        Route::post('/assign-shift', [HRMShiftController::class, 'assignShift']);
        
        // Attendance
        Route::get('/attendance', [HRMAttendanceController::class, 'getBranchAttendance']);
        Route::post('/attendance', [HRMAttendanceController::class, 'recordAttendance']);
        Route::get('/attendance-report', [HRMAttendanceController::class, 'getAttendanceReport']);
        
        // Salary Increments (STEP 14)
        Route::get('/increments', [HRMSalaryIncrementController::class, 'getPendingIncrements']);
        Route::post('/increments', [HRMSalaryIncrementController::class, 'createIncrement']);
        
        // Deductions (STEP 15)
        Route::get('/deduction-types', [HRMDeductionController::class, 'getDeductionTypes']);
        Route::get('/deductions', [HRMDeductionController::class, 'getActiveDeductionsForPayroll']);
        Route::post('/deductions', [HRMDeductionController::class, 'createDeduction']);
        
        // HR Letters (STEP 16 & 17)
        Route::get('/letter-requests', [HRMLetterController::class, 'getPendingRequests']);
        Route::get('/letter-requests/{id}/preview', [HRMLetterController::class, 'previewLetter']);
        Route::put('/letter-requests/{id}/process', [HRMLetterController::class, 'processRequest']);
        Route::put('/letter-requests/{id}/update-content', [HRMLetterController::class, 'updateLetterContent']);
        Route::put('/letter-requests/{id}/collected', [HRMLetterController::class, 'markCollected']);
        
        // HR Analytics (STEP 19) - Branch level
        Route::get('/analytics/workforce', [HRMAnalyticsController::class, 'getWorkforceAnalytics']);
        Route::get('/analytics/attendance', [HRMAnalyticsController::class, 'getAttendanceAnalytics']);
        Route::get('/analytics/leave', [HRMAnalyticsController::class, 'getLeaveAnalytics']);
        Route::get('/analytics/overtime', [HRMAnalyticsController::class, 'getOvertimeAnalytics']);
        
        // Audit Logs (STEP 20) - Branch level (filtered by branch_id automatically)
        Route::get('/audit-logs', [HRMAuditLogController::class, 'index']);
        Route::get('/audit-logs/{id}', [HRMAuditLogController::class, 'show']);
        
        // Schedule Change Requests - Employee requests for cancellation, time off, shift swap
        Route::get('/schedule-requests', [HRMShiftController::class, 'getScheduleChangeRequests']);
        Route::get('/schedule-requests/pending-count', [HRMShiftController::class, 'getPendingScheduleRequestCount']);
        Route::post('/schedule-requests/{id}/respond', [HRMShiftController::class, 'respondToScheduleChangeRequest']);
        
        // Public Holidays API (proxy to avoid CORS issues)
        Route::get('/holidays/{year?}', [HRMShiftController::class, 'getPublicHolidays']);
    });
    
    // =============================================
    // Employee Self-Service HRM Routes
    // =============================================
    Route::prefix('employee')->group(function () {
        // Dashboard stats
        Route::get('/stats', [HRMController::class, 'getEmployeeStats']);
        
        // Profile
        Route::get('/profile', [HRMController::class, 'getEmployeeProfile']);
        
        // Leave management
        Route::get('/leave-balance', [HRMLeaveController::class, 'getLeaveBalance']);
        Route::get('/leave-history', [HRMLeaveController::class, 'getLeaveHistory']);
        Route::post('/apply-leave', [HRMLeaveController::class, 'applyLeave']);
        Route::delete('/leave/{id}', [HRMLeaveController::class, 'cancelLeave']);
        
        // Overtime
        Route::get('/overtime', [HRMOvertimeController::class, 'getEmployeeOvertime']);
        
        // Payslips
        Route::get('/payslips', [HRMPayslipController::class, 'getEmployeePayslips']);
        Route::get('/payslips/{id}', [HRMPayslipController::class, 'getPayslipDetails']);
        
        // Shifts
        Route::get('/shifts', [HRMShiftController::class, 'getEmployeeShifts']);
        Route::put('/shifts/{id}/acknowledge', [HRMShiftController::class, 'acknowledgeShift']);
        
        // Attendance
        Route::get('/attendance', [HRMAttendanceController::class, 'getEmployeeAttendance']);
        
        // Salary Increments (STEP 14) - View own history
        Route::get('/increments', [HRMSalaryIncrementController::class, 'getEmployeeIncrements']);
        
        // Deductions (STEP 15) - View own deductions
        Route::get('/deductions', [HRMDeductionController::class, 'getEmployeeDeductions']);
        Route::get('/deductions/{id}/history', [HRMDeductionController::class, 'getDeductionHistory']);
        
        // HR Letters (STEP 16 & 17) - Request and view own letters
        Route::get('/letter-templates', [HRMLetterController::class, 'getLetterTemplates']);
        Route::get('/letter-requests', [HRMLetterController::class, 'getMyLetterRequests']);
        Route::post('/letter-requests', [HRMLetterController::class, 'requestLetter']);
        Route::get('/letter-requests/{id}', [HRMLetterController::class, 'getLetterDetails']);
        Route::get('/letter-requests/{id}/content', [HRMLetterController::class, 'getMyLetterContent']);
        
        // HR Complaints (STEP 18) - Submit and track own complaints
        Route::get('/complaints', [HRMComplaintController::class, 'getMyComplaints']);
        Route::post('/complaints', [HRMComplaintController::class, 'submitComplaint']);
        Route::get('/complaints/{id}', [HRMComplaintController::class, 'getComplaintDetails']);
        Route::post('/complaints/{id}/comment', [HRMComplaintController::class, 'addComment']);
        Route::put('/complaints/{id}/withdraw', [HRMComplaintController::class, 'withdrawComplaint']);
        Route::put('/complaints/{id}/rating', [HRMComplaintController::class, 'submitRating']);
    });
    
    // =============================================
    // Cashier HR Self-Service Portal Routes
    // =============================================
    Route::prefix('cashier')->group(function () {
        // Dashboard
        Route::get('/dashboard-stats', [CashierHRController::class, 'getDashboardStats']);
        
        // Schedules
        Route::get('/schedules', [CashierHRController::class, 'getSchedules']);
        Route::post('/acknowledge-shift', [CashierHRController::class, 'acknowledgeShift']);
        Route::post('/reject-shift', [CashierHRController::class, 'rejectShift']);
        
        // Shift Interchange
        Route::get('/interchange-requests', [CashierHRController::class, 'getInterchangeRequests']);
        Route::post('/respond-interchange', [CashierHRController::class, 'respondToInterchange']);
        
        // Incoming Swap Requests (from colleagues)
        Route::get('/incoming-swap-requests', [CashierHRController::class, 'getIncomingSwapRequests']);
        Route::post('/respond-swap-request', [CashierHRController::class, 'respondToSwapRequest']);
        
        // Schedule Change Requests
        Route::get('/schedule-change-requests', [CashierHRController::class, 'getScheduleChangeRequests']);
        Route::post('/schedule-change-request', [CashierHRController::class, 'submitScheduleChangeRequest']);
        Route::get('/colleagues', [CashierHRController::class, 'getColleagues']);
        Route::get('/shift-types', [CashierHRController::class, 'getShiftTypes']);
        
        // Overtime & Salary
        Route::get('/overtime', [CashierHRController::class, 'getOvertime']);
        Route::get('/payslips', [CashierHRController::class, 'getPayslips']);
        Route::get('/salary-structure', [CashierHRController::class, 'getSalaryStructure']);
        Route::get('/payslip/{id}/download', [CashierHRController::class, 'downloadPayslip']);
        
        // Service Letters
        Route::get('/service-letter-requests', [CashierHRController::class, 'getServiceLetterRequests']);
        Route::post('/service-letter-request', [CashierHRController::class, 'submitServiceLetterRequest']);
        Route::get('/service-letter-requests/{id}/content', [HRMLetterController::class, 'getMyLetterContent']);
        
        // HR Policies
        Route::get('/policies', [CashierHRController::class, 'getPolicies']);
    });
    
    // =============================================
    // Shared Routes
    // =============================================
    
    // Leave types configuration
    Route::get('/leave-types', [HRMLeaveController::class, 'getLeaveTypes']);
    
    // Shift definitions (read-only for all authenticated users)
    Route::get('/shifts', [HRMShiftController::class, 'getShiftDefinitions']);
});
