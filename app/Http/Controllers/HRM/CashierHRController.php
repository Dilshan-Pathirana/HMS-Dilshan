<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Laravel\Sanctum\PersonalAccessToken;

class CashierHRController extends Controller
{
    /**
     * Validate the bearer token and return the user
     */
    private function validateToken(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        $accessToken = PersonalAccessToken::findToken($token);
        return $accessToken ? $accessToken->tokenable : null;
    }

    /**
     * Get dashboard statistics for cashier HR portal
     */
    public function getDashboardStats(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            $currentMonth = date('Y-m');
            
            // Get upcoming shifts count from shift_assignments
            $upcomingShifts = 0;
            $pendingAcknowledgments = 0;
            
            // Check shift_assignments table
            if (DB::getSchemaBuilder()->hasTable('shift_assignments')) {
                $upcomingShifts += DB::table('shift_assignments')
                    ->where('user_id', $userId)
                    ->where('effective_from', '<=', date('Y-m-d', strtotime('+30 days')))
                    ->where(function($q) {
                        $q->whereNull('effective_to')
                          ->orWhere('effective_to', '>=', date('Y-m-d'));
                    })
                    ->where('status', '!=', 'cancelled')
                    ->count();
                
                // Get pending acknowledgments from shift_assignments
                $pendingAcknowledgments += DB::table('shift_assignments')
                    ->where('user_id', $userId)
                    ->where('status', 'pending')
                    ->whereNull('acknowledged_at')
                    ->count();
            }
            
            // Also check shift_management table for pending shifts
            if (DB::getSchemaBuilder()->hasTable('shift_management')) {
                $hasStatusColumn = DB::getSchemaBuilder()->hasColumn('shift_management', 'status');
                
                if ($hasStatusColumn) {
                    // Get upcoming shifts
                    $upcomingShifts += DB::table('shift_management')
                        ->where('user_id', $userId)
                        ->where('status', '!=', 'cancelled')
                        ->count();
                    
                    // Get pending acknowledgments from shift_management
                    $pendingAcknowledgments += DB::table('shift_management')
                        ->where('user_id', $userId)
                        ->where('status', 'pending')
                        ->count();
                } else {
                    // Count shifts that don't have acknowledged in notes
                    $allLegacyShifts = DB::table('shift_management')
                        ->where('user_id', $userId)
                        ->get();
                    
                    foreach ($allLegacyShifts as $shift) {
                        $upcomingShifts++;
                        $notes = json_decode($shift->notes ?? '{}', true);
                        if (empty($notes['acknowledged'])) {
                            $pendingAcknowledgments++;
                        }
                    }
                }
            }
            
            // Get this month OT hours
            $thisMonthOT = DB::table('employee_ot')
                ->where('employee_id', $userId)
                ->whereYear('date', date('Y'))
                ->whereMonth('date', date('m'))
                ->sum('hours_worked');
            
            // Get last payslip month
            $lastPayslip = DB::table('staff_salary_pay')
                ->where('user_id', $userId)
                ->orderBy('month', 'desc')
                ->value('month');
            
            $lastPayslipFormatted = $lastPayslip 
                ? Carbon::parse($lastPayslip . '-01')->format('M Y')
                : '-';
            
            // Get pending HR letter requests count
            $pendingRequests = DB::table('hr_letter_requests')
                ->where('user_id', $userId)
                ->where('status', 'pending')
                ->count();
            
            return response()->json([
                'status' => 200,
                'stats' => [
                    'upcomingShifts' => $upcomingShifts,
                    'pendingAcknowledgments' => $pendingAcknowledgments,
                    'thisMonthOT' => (float) ($thisMonthOT ?? 0),
                    'lastPayslip' => $lastPayslipFormatted,
                    'pendingRequests' => $pendingRequests
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's schedules for a specific month
     */
    public function getSchedules(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            $month = $request->query('month', date('Y-m'));
            
            // Parse month to get date range
            $startDate = Carbon::parse($month . '-01')->startOfMonth();
            $endDate = Carbon::parse($month . '-01')->endOfMonth();
            
            $shifts = collect();
            
            // First try shift_assignments table
            if (DB::getSchemaBuilder()->hasTable('shift_assignments') && 
                DB::getSchemaBuilder()->hasTable('shift_definitions')) {
                $assignmentShifts = DB::table('shift_assignments as sa')
                    ->leftJoin('shift_definitions as sd', 'sa.shift_definition_id', '=', 'sd.id')
                    ->where('sa.user_id', $userId)
                    ->where('sa.effective_from', '<=', $endDate)
                    ->where(function($q) use ($startDate) {
                        $q->whereNull('sa.effective_to')
                          ->orWhere('sa.effective_to', '>=', $startDate);
                    })
                    ->select(
                        'sa.id',
                        'sa.effective_from as date',
                        'sd.shift_name as shiftType',
                        'sd.start_time as startTime',
                        'sd.end_time as endTime',
                        'sd.standard_hours as duration',
                        'sa.status',
                        'sa.acknowledged_at as acknowledgedAt',
                        'sa.notes',
                        DB::raw("'shift_assignments' as source")
                    )
                    ->orderBy('sa.effective_from', 'asc')
                    ->get();
                
                $shifts = $shifts->merge($assignmentShifts);
            }
            
            // Also check shift_management table (legacy)
            if (DB::getSchemaBuilder()->hasTable('shift_management')) {
                $hasStatusColumn = DB::getSchemaBuilder()->hasColumn('shift_management', 'status');
                
                $selectColumns = [
                    'sm.id',
                    'sm.shift_type as shiftType',
                    'sm.start_time as startTime',
                    'sm.end_time as endTime',
                    'sm.notes',
                    'sm.days_of_week',
                    'sm.created_at',
                    DB::raw("'shift_management' as source")
                ];
                
                if ($hasStatusColumn) {
                    $selectColumns[] = 'sm.status';
                    $selectColumns[] = 'sm.acknowledged_at as acknowledgedAt';
                } else {
                    $selectColumns[] = DB::raw("'pending' as status");
                    $selectColumns[] = DB::raw("NULL as acknowledgedAt");
                }
                
                $managementShifts = DB::table('shift_management as sm')
                    ->where('sm.user_id', $userId)
                    ->select($selectColumns)
                    ->orderBy('sm.created_at', 'desc')
                    ->get()
                    ->map(function($shift) use ($startDate, $endDate) {
                        // Parse days_of_week to check if schedule applies to this month
                        $daysOfWeek = json_decode($shift->days_of_week, true) ?? [];
                        
                        // Calculate duration from start/end time
                        $duration = 8;
                        if ($shift->startTime && $shift->endTime) {
                            $start = Carbon::parse($shift->startTime);
                            $end = Carbon::parse($shift->endTime);
                            if ($end < $start) $end->addDay();
                            $duration = $start->diffInHours($end);
                        }
                        
                        // For shift_management, use created_at as effective date if no effective_from
                        $date = Carbon::parse($shift->created_at)->format('Y-m-d');
                        
                        return (object)[
                            'id' => $shift->id,
                            'date' => $date,
                            'shiftType' => $shift->shiftType ?? 'Shift',
                            'startTime' => $shift->startTime ?? '08:00',
                            'endTime' => $shift->endTime ?? '17:00',
                            'duration' => $duration,
                            'status' => $shift->status ?? 'pending',
                            'acknowledgedAt' => $shift->acknowledgedAt ?? null,
                            'notes' => $shift->notes,
                            'source' => 'shift_management',
                            'daysOfWeek' => $daysOfWeek
                        ];
                    });
                
                $shifts = $shifts->merge($managementShifts);
            }
            
            // Format final shifts
            $formattedShifts = $shifts->map(function($shift) {
                return [
                    'id' => $shift->id,
                    'date' => $shift->date ?? date('Y-m-d'),
                    'shiftType' => $shift->shiftType ?? 'Morning',
                    'startTime' => $shift->startTime ?? '08:00',
                    'endTime' => $shift->endTime ?? '17:00',
                    'duration' => $shift->duration ?? 8,
                    'status' => $shift->status ?? 'pending',
                    'acknowledgedAt' => $shift->acknowledgedAt ?? null,
                    'notes' => $shift->notes ?? null,
                    'source' => $shift->source ?? 'unknown',
                    'daysOfWeek' => $shift->daysOfWeek ?? []
                ];
            })->values();
            
            // Fetch approved schedule overrides for this user
            $overrides = collect();
            if (DB::getSchemaBuilder()->hasTable('employee_schedule_overrides')) {
                $overrides = DB::table('employee_schedule_overrides')
                    ->where('user_id', $userId)
                    ->where('status', 'active')
                    ->whereBetween('override_date', [$startDate, $endDate])
                    ->get()
                    ->keyBy('override_date');
            }
            
            // Count pending acknowledgments for notification
            $pendingCount = $formattedShifts->where('status', 'pending')->count();
            
            return response()->json([
                'status' => 200,
                'shifts' => $formattedShifts,
                'pendingCount' => $pendingCount,
                'overrides' => $overrides->map(function($override) {
                    return [
                        'id' => $override->id,
                        'date' => $override->override_date,
                        'type' => $override->override_type,
                        'originalShiftType' => $override->original_shift_type,
                        'newShiftType' => $override->new_shift_type,
                        'newStartTime' => $override->new_start_time,
                        'newEndTime' => $override->new_end_time,
                        'reason' => $override->reason,
                        'status' => $override->status
                    ];
                })->values()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch schedules',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Acknowledge a shift
     */
    public function acknowledgeShift(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $request->validate([
                'shift_id' => 'required'
            ]);
            
            $userId = $user->id;
            $shiftId = $request->shift_id;
            $updated = false;
            
            // First try shift_assignments table
            if (DB::getSchemaBuilder()->hasTable('shift_assignments')) {
                $updated = DB::table('shift_assignments')
                    ->where('id', $shiftId)
                    ->where('user_id', $userId)
                    ->update([
                        'status' => 'acknowledged',
                        'acknowledged_at' => now(),
                        'updated_at' => now()
                    ]);
            }
            
            // If not found in shift_assignments, try shift_management
            if (!$updated && DB::getSchemaBuilder()->hasTable('shift_management')) {
                $hasStatusColumn = DB::getSchemaBuilder()->hasColumn('shift_management', 'status');
                
                if ($hasStatusColumn) {
                    $updated = DB::table('shift_management')
                        ->where('id', $shiftId)
                        ->where('user_id', $userId)
                        ->update([
                            'status' => 'acknowledged',
                            'acknowledged_at' => now(),
                            'updated_at' => now()
                        ]);
                } else {
                    // If no status column, update via notes
                    $shift = DB::table('shift_management')
                        ->where('id', $shiftId)
                        ->where('user_id', $userId)
                        ->first();
                    
                    if ($shift) {
                        $notes = json_decode($shift->notes ?? '{}', true);
                        $notes['acknowledged'] = true;
                        $notes['acknowledged_at'] = now()->toDateTimeString();
                        
                        $updated = DB::table('shift_management')
                            ->where('id', $shiftId)
                            ->update([
                                'notes' => json_encode($notes),
                                'updated_at' => now()
                            ]);
                    }
                }
            }
            
            if ($updated) {
                return response()->json([
                    'status' => 200,
                    'message' => 'Shift acknowledged successfully'
                ]);
            }
            
            return response()->json([
                'status' => 404,
                'message' => 'Shift not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to acknowledge shift',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a shift assignment
     */
    public function rejectShift(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $request->validate([
                'shift_id' => 'required',
                'rejection_reason' => 'nullable|string|max:500'
            ]);
            
            $userId = $user->id;
            $shiftId = $request->shift_id;
            $rejectionReason = $request->rejection_reason ?? '';
            $updated = false;
            
            // First try shift_assignments table
            if (DB::getSchemaBuilder()->hasTable('shift_assignments')) {
                $updated = DB::table('shift_assignments')
                    ->where('id', $shiftId)
                    ->where('user_id', $userId)
                    ->update([
                        'status' => 'rejected',
                        'rejection_reason' => $rejectionReason,
                        'updated_at' => now()
                    ]);
            }
            
            // If not found in shift_assignments, try shift_management
            if (!$updated && DB::getSchemaBuilder()->hasTable('shift_management')) {
                $hasStatusColumn = DB::getSchemaBuilder()->hasColumn('shift_management', 'status');
                
                if ($hasStatusColumn) {
                    $updated = DB::table('shift_management')
                        ->where('id', $shiftId)
                        ->where('user_id', $userId)
                        ->update([
                            'status' => 'rejected',
                            'rejection_reason' => $rejectionReason,
                            'updated_at' => now()
                        ]);
                } else {
                    // If no status column, update via notes
                    $shift = DB::table('shift_management')
                        ->where('id', $shiftId)
                        ->where('user_id', $userId)
                        ->first();
                    
                    if ($shift) {
                        $notes = json_decode($shift->notes ?? '{}', true);
                        $notes['rejected'] = true;
                        $notes['rejection_reason'] = $rejectionReason;
                        $notes['rejected_at'] = now()->toDateTimeString();
                        
                        $updated = DB::table('shift_management')
                            ->where('id', $shiftId)
                            ->update([
                                'notes' => json_encode($notes),
                                'updated_at' => now()
                            ]);
                    }
                }
            }
            
            if ($updated) {
                return response()->json([
                    'status' => 200,
                    'message' => 'Shift rejected'
                ]);
            }
            
            return response()->json([
                'status' => 404,
                'message' => 'Shift not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to reject shift',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get interchange requests for the user
     * Note: Returns empty array if table doesn't exist yet
     */
    public function getInterchangeRequests(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            
            // Check if shift_handovers table can be used for interchange
            $hasTable = DB::getSchemaBuilder()->hasTable('shift_handovers');
            
            if (!$hasTable) {
                return response()->json([
                    'status' => 200,
                    'requests' => []
                ]);
            }
            
            $requests = DB::table('shift_handovers as sh')
                ->leftJoin('users as u', 'sh.from_user_id', '=', 'u.id')
                ->where('sh.to_user_id', $userId)
                ->where('sh.status', 'pending')
                ->select(
                    'sh.id',
                    'sh.from_user_id as requestedBy',
                    'u.name as requestedByName',
                    'sh.shift_date as shiftDate',
                    'sh.notes as reason',
                    'sh.status',
                    'sh.created_at as createdAt'
                )
                ->orderBy('sh.created_at', 'desc')
                ->get();
            
            return response()->json([
                'status' => 200,
                'requests' => $requests
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 200,
                'requests' => []
            ]);
        }
    }

    /**
     * Respond to an interchange request
     */
    public function respondToInterchange(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $request->validate([
                'request_id' => 'required',
                'action' => 'required|in:approve,reject'
            ]);
            
            $userId = $user->id;
            $action = $request->action;
            
            $hasTable = DB::getSchemaBuilder()->hasTable('shift_handovers');
            
            if (!$hasTable) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Feature not yet available'
                ], 404);
            }
            
            $updated = DB::table('shift_handovers')
                ->where('id', $request->request_id)
                ->where('to_user_id', $userId)
                ->update([
                    'status' => $action === 'approve' ? 'approved' : 'rejected',
                    'responded_at' => now(),
                    'updated_at' => now()
                ]);
            
            if ($updated) {
                return response()->json([
                    'status' => 200,
                    'message' => 'Request ' . $action . 'd successfully'
                ]);
            }
            
            return response()->json([
                'status' => 404,
                'message' => 'Request not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to respond to interchange request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get overtime records for the user
     */
    public function getOvertime(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            $month = $request->query('month', date('Y-m'));
            
            $overtimeRecords = DB::table('employee_ot')
                ->where('employee_id', $userId)
                ->where('date', 'like', $month . '%')
                ->orderBy('date', 'desc')
                ->get()
                ->map(function($ot) {
                    return [
                        'id' => $ot->id,
                        'date' => $ot->date,
                        'hoursWorked' => (float) $ot->hours_worked,
                        'otRate' => (float) $ot->ot_rate,
                        'totalAmount' => (float) $ot->total_ot_amount,
                        'status' => $ot->status ?? 'approved'
                    ];
                });
            
            return response()->json([
                'status' => 200,
                'overtime' => $overtimeRecords
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch overtime records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's payslips
     */
    public function getPayslips(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            
            $payslips = DB::table('staff_salary_pay')
                ->where('user_id', $userId)
                ->orderBy('month', 'desc')
                ->get()
                ->map(function($payslip) {
                    // Get salary structure for calculations
                    $salary = DB::table('staff_salary')
                        ->where('user_id', $payslip->user_id)
                        ->first();
                    
                    $basicSalary = $salary->basic_salary_amount ?? 0;
                    $allowances = $salary->allocation_amount ?? 0;
                    
                    // Get OT for that month
                    $ot = DB::table('employee_ot')
                        ->where('employee_id', $payslip->user_id)
                        ->where('date', 'like', $payslip->month . '%')
                        ->sum('total_ot_amount');
                    
                    $gross = $basicSalary + $allowances + $ot;
                    $epfEmployee = $gross * 0.08;
                    $epfEmployer = $gross * 0.12;
                    $etfEmployer = $gross * 0.03;
                    $net = $gross - $epfEmployee;
                    
                    return [
                        'id' => $payslip->id,
                        'month' => $payslip->month,
                        'basicSalary' => (float) $basicSalary,
                        'allowances' => (float) $allowances,
                        'overtime' => (float) $ot,
                        'grossSalary' => (float) $gross,
                        'epfEmployee' => (float) $epfEmployee,
                        'epfEmployer' => (float) $epfEmployer,
                        'etfEmployer' => (float) $etfEmployer,
                        'otherDeductions' => 0,
                        'netSalary' => (float) $net,
                        'paymentDate' => $payslip->created_at,
                        'status' => $payslip->status ?? 'paid'
                    ];
                });
            
            return response()->json([
                'status' => 200,
                'payslips' => $payslips
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch payslips',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download payslip as PDF
     */
    public function downloadPayslip(Request $request, $id)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            
            // Get payslip
            $payslip = DB::table('staff_salary_pay')
                ->where('id', $id)
                ->where('user_id', $userId)
                ->first();
            
            if (!$payslip) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Payslip not found'
                ], 404);
            }
            
            // Get salary structure
            $salary = DB::table('staff_salary')
                ->where('user_id', $userId)
                ->first();
            
            // Get OT for that month
            $ot = DB::table('employee_ot')
                ->where('employee_id', $userId)
                ->where('date', 'like', $payslip->month . '%')
                ->sum('total_ot_amount');
            
            $basicSalary = $salary->basic_salary_amount ?? 0;
            $allowances = $salary->allocation_amount ?? 0;
            $gross = $basicSalary + $allowances + $ot;
            $epfEmployee = $gross * 0.08;
            $net = $gross - $epfEmployee;
            
            // Get user details
            $employee = DB::table('users')
                ->where('id', $userId)
                ->first();
            
            $employeeName = $employee->name ?: trim($employee->first_name . ' ' . $employee->last_name) ?: 'Employee';
            
            // Get branch details
            $branch = DB::table('branches')
                ->where('id', $employee->branch_id)
                ->first();
            
            $branchName = $branch->name ?? 'Main Branch';
            
            $monthFormatted = \Carbon\Carbon::parse($payslip->month . '-01')->format('F Y');
            
            // Generate HTML for PDF
            $html = '
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
                    .header h1 { color: #10b981; margin: 0; }
                    .header p { color: #666; margin: 5px 0; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .info-box { background: #f3f4f6; padding: 15px; border-radius: 5px; width: 45%; }
                    .info-box h3 { margin: 0 0 10px 0; color: #333; font-size: 14px; }
                    .info-box p { margin: 5px 0; color: #666; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                    th { background: #f9fafb; font-weight: 600; }
                    .earnings { color: #10b981; }
                    .deductions { color: #ef4444; }
                    .total-row { background: #f0fdf4; font-weight: bold; }
                    .net-salary { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-top: 30px; }
                    .net-salary h2 { margin: 0; font-size: 24px; }
                    .net-salary p { margin: 5px 0 0 0; opacity: 0.9; }
                    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 11px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CURE.LK</h1>
                    <p>Healthcare Management System</p>
                    <p>Payslip for ' . $monthFormatted . '</p>
                </div>
                
                <table>
                    <tr>
                        <td><strong>Employee:</strong> ' . htmlspecialchars($employeeName) . '</td>
                        <td><strong>Employee ID:</strong> ' . substr($userId, 0, 8) . '</td>
                    </tr>
                    <tr>
                        <td><strong>Branch:</strong> ' . htmlspecialchars($branchName) . '</td>
                        <td><strong>Payment Date:</strong> ' . \Carbon\Carbon::parse($payslip->created_at)->format('d M Y') . '</td>
                    </tr>
                </table>
                
                <h3>Earnings</h3>
                <table>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount (LKR)</th>
                    </tr>
                    <tr>
                        <td>Basic Salary</td>
                        <td style="text-align: right;" class="earnings">' . number_format($basicSalary, 2) . '</td>
                    </tr>
                    <tr>
                        <td>Allowances</td>
                        <td style="text-align: right;" class="earnings">' . number_format($allowances, 2) . '</td>
                    </tr>
                    <tr>
                        <td>Overtime</td>
                        <td style="text-align: right;" class="earnings">' . number_format($ot, 2) . '</td>
                    </tr>
                    <tr class="total-row">
                        <td>Gross Salary</td>
                        <td style="text-align: right;">' . number_format($gross, 2) . '</td>
                    </tr>
                </table>
                
                <h3>Deductions</h3>
                <table>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount (LKR)</th>
                    </tr>
                    <tr>
                        <td>EPF (Employee 8%)</td>
                        <td style="text-align: right;" class="deductions">-' . number_format($epfEmployee, 2) . '</td>
                    </tr>
                </table>
                
                <div class="net-salary">
                    <h2>LKR ' . number_format($net, 2) . '</h2>
                    <p>Net Salary (Take Home)</p>
                </div>
                
                <div class="footer">
                    <p>This is a computer-generated payslip and does not require a signature.</p>
                    <p>Generated on ' . now()->format('d M Y H:i:s') . '</p>
                </div>
            </body>
            </html>';
            
            // Return HTML as a simple downloadable file (in production, use a PDF library like dompdf)
            return response($html)
                ->header('Content-Type', 'text/html')
                ->header('Content-Disposition', 'attachment; filename="payslip-' . $payslip->month . '.html"');
                
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to download payslip',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's salary structure
     */
    public function getSalaryStructure(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            
            $salary = DB::table('staff_salary')
                ->where('user_id', $userId)
                ->first();
            
            if ($salary) {
                return response()->json([
                    'status' => 200,
                    'salary' => [
                        'basicSalary' => (float) $salary->basic_salary_amount,
                        'allocationAmount' => (float) $salary->allocation_amount,
                        'hourlyRate' => (float) $salary->rate_for_hour,
                        'maxHours' => (float) $salary->maximum_hours_can_work
                    ]
                ]);
            }
            
            return response()->json([
                'status' => 404,
                'message' => 'Salary structure not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch salary structure',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get service letter requests for the user
     * Uses hr_letter_requests table
     */
    public function getServiceLetterRequests(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            
            $requests = DB::table('hr_letter_requests as hlr')
                ->leftJoin('hr_letter_templates as hlt', 'hlr.template_id', '=', 'hlt.id')
                ->where('hlr.user_id', $userId)
                ->whereNull('hlr.deleted_at')
                ->select(
                    'hlr.id',
                    'hlr.reference_number',
                    'hlt.letter_type as letterType',
                    'hlt.name as letterTypeName',
                    'hlr.purpose',
                    'hlr.addressed_to as addressedTo',
                    'hlr.required_by as urgency',
                    'hlr.status',
                    'hlr.created_at as requestedDate',
                    'hlr.processed_at as completedDate',
                    'hlr.rejection_reason as rejectionReason',
                    'hlr.file_path as documentUrl',
                    'hlr.generated_content'
                )
                ->orderBy('hlr.created_at', 'desc')
                ->get()
                ->map(function($req) {
                    return [
                        'id' => $req->id,
                        'referenceNumber' => $req->reference_number,
                        'letterType' => $req->letterType ?? 'service_letter',
                        'templateName' => $req->letterTypeName ?? 'Service Letter',
                        'purpose' => $req->purpose,
                        'addressedTo' => $req->addressedTo,
                        'urgency' => $req->urgency ? 'urgent' : 'normal',
                        'status' => $req->status ?? 'pending',
                        'requestedDate' => $req->requestedDate,
                        'completedDate' => $req->completedDate,
                        'rejectionReason' => $req->rejectionReason,
                        'documentUrl' => $req->documentUrl,
                        'hasContent' => !empty($req->generated_content)
                    ];
                });
            
            return response()->json([
                'status' => 200,
                'requests' => $requests
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch service letter requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit a service letter request
     */
    public function submitServiceLetterRequest(Request $request)
    {
        try {
            \Log::info('Service letter request received', ['input' => $request->all()]);
            
            $user = $this->validateToken($request);
            if (!$user) {
                \Log::warning('Service letter request - unauthorized');
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            \Log::info('Service letter request - user validated', ['user_id' => $user->id]);
            
            $request->validate([
                'letterType' => 'required|string',
                'purpose' => 'required|string',
                'addressedTo' => 'required|string',
                'urgency' => 'required|in:normal,urgent'
            ]);
            
            $userId = $user->id;
            
            // Find template by letter type
            $template = DB::table('hr_letter_templates')
                ->where('letter_type', $request->letterType)
                ->where('is_active', 1)
                ->first();
            
            $templateId = $template ? $template->id : null;
            \Log::info('Service letter request - template lookup', ['letter_type' => $request->letterType, 'template_id' => $templateId]);
            
            // Generate reference number
            $refNumber = 'LTR-' . date('Ymd') . '-' . strtoupper(Str::random(4));
            
            DB::table('hr_letter_requests')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $userId,
                'template_id' => $templateId,
                'reference_number' => $refNumber,
                'purpose' => $request->purpose,
                'addressed_to' => $request->addressedTo,
                'required_by' => $request->urgency === 'urgent' ? now()->addDays(3) : now()->addDays(7),
                'status' => 'pending',
                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            \Log::info('Service letter request - inserted successfully', ['ref' => $refNumber]);
            
            return response()->json([
                'status' => 201,
                'message' => 'Service letter request submitted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Service letter request - error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'status' => 500,
                'message' => 'Failed to submit service letter request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get HR policies
     */
    public function getPolicies(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            $userBranchId = DB::table('users')->where('id', $userId)->value('branch_id');
            
            $policies = DB::table('hr_policies')
                ->where(function($query) use ($userBranchId) {
                    $query->whereNull('branch_id')
                          ->orWhere('branch_id', $userBranchId);
                })
                ->where('status', 'Active')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($policy) {
                    // Map policy categories to frontend-friendly values
                    $categoryMap = [
                        'Leave' => 'leave',
                        'Attendance' => 'hr',
                        'Salary & Compensation' => 'payroll',
                        'Benefits' => 'payroll',
                        'Working Hours' => 'hr',
                        'Code of Conduct' => 'code_of_conduct',
                        'Health & Safety' => 'safety',
                        'Disciplinary' => 'hr',
                        'Training & Development' => 'hr',
                        'Resignation & Termination' => 'hr',
                        'Other' => 'hr'
                    ];
                    
                    $category = $categoryMap[$policy->policy_category] ?? 'hr';
                    
                    return [
                        'id' => $policy->id,
                        'title' => $policy->policy_name,
                        'category' => $category,
                        'categoryName' => $policy->policy_category ?? 'HR',
                        'description' => $policy->description,
                        'content' => $policy->policy_content,
                        'effectiveDate' => $policy->effective_date,
                        'expiryDate' => $policy->expiry_date,
                        'lastUpdated' => $policy->updated_at,
                        'documentUrl' => $policy->document_path ? '/storage/' . $policy->document_path : null,
                        'status' => $policy->status,
                        'version' => '1.0'
                    ];
                });
            
            return response()->json([
                'status' => 200,
                'policies' => $policies
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch policies',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get schedule change requests from the schedule_change_requests table
     */
    public function getScheduleChangeRequests(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            
            // Use SQLite-compatible string concatenation
            $driver = DB::connection()->getDriverName();
            $concatInterchange = $driver === 'sqlite'
                ? "(u.first_name || ' ' || u.last_name)"
                : "CONCAT(u.first_name, ' ', u.last_name)";
            $concatResponder = $driver === 'sqlite'
                ? "(responder.first_name || ' ' || responder.last_name)"
                : "CONCAT(responder.first_name, ' ', responder.last_name)";
            
            // Get requests from schedule_change_requests table
            $requests = DB::table('schedule_change_requests as scr')
                ->leftJoin('users as u', 'scr.interchange_with', '=', 'u.id')
                ->leftJoin('users as responder', 'scr.responded_by', '=', 'responder.id')
                ->where('scr.user_id', $userId)
                ->select(
                    'scr.id',
                    'scr.request_type as requestType',
                    'scr.original_shift_date as originalShiftDate',
                    'scr.original_shift_type as originalShiftType',
                    'scr.requested_shift_date as requestedShiftDate',
                    'scr.requested_shift_type as requestedShiftType',
                    'scr.interchange_with as interchangeWith',
                    DB::raw("{$concatInterchange} as interchangeWithName"),
                    'scr.reason',
                    'scr.status',
                    'scr.peer_status as peerStatus',
                    'scr.peer_responded_at as peerRespondedAt',
                    'scr.peer_rejection_reason as peerRejectionReason',
                    'scr.interchange_shift_date as interchangeShiftDate',
                    'scr.interchange_shift_type as interchangeShiftType',
                    'scr.created_at as requestedDate',
                    'scr.responded_at as responseDate',
                    DB::raw("{$concatResponder} as responseBy"),
                    'scr.rejection_reason as rejectionReason'
                )
                ->orderBy('scr.created_at', 'desc')
                ->get();
            
            return response()->json([
                'status' => 200,
                'requests' => $requests
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch schedule change requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit a schedule change request
     * For interchange requests: sends to colleague first for approval
     * For other requests: notifies branch admin directly
     */
    public function submitScheduleChangeRequest(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $request->validate([
                'requestType' => 'required|in:change,interchange,time_off,cancellation',
                'originalShiftDate' => 'required|date',
                'originalShiftType' => 'nullable|string',
                'reason' => 'required|string'
            ]);
            
            $userId = $user->id;
            $userRecord = DB::table('users')->where('id', $userId)->first();
            $branchId = $userRecord->branch_id ?? null;
            
            // For interchange requests, verify the colleague exists and is valid
            $isInterchange = $request->requestType === 'interchange';
            $colleagueId = $request->interchangeWith;
            
            if ($isInterchange) {
                if (!$colleagueId) {
                    return response()->json([
                        'status' => 400,
                        'message' => 'Please select a colleague to swap shifts with'
                    ], 400);
                }
                
                // Verify colleague is in same branch and not a patient
                $colleague = DB::table('users')
                    ->where('id', $colleagueId)
                    ->where('branch_id', $branchId)
                    ->whereNotIn('role_as', [5]) // Not a patient
                    ->first();
                
                if (!$colleague) {
                    return response()->json([
                        'status' => 400,
                        'message' => 'Invalid colleague selected'
                    ], 400);
                }
            }
            
            // Save to schedule_change_requests table
            $requestId = Str::uuid()->toString();
            
            // For interchange requests:
            // - peer_status starts as 'pending' (colleague must approve first)
            // - status stays 'pending' (will go to admin after colleague approves)
            // - notified_to_admin is false (will be set true after colleague approves)
            $peerStatus = $isInterchange ? 'pending' : null;
            
            DB::table('schedule_change_requests')->insert([
                'id' => $requestId,
                'user_id' => $userId,
                'branch_id' => $branchId,
                'request_type' => $request->requestType,
                'original_shift_date' => $request->originalShiftDate,
                'original_shift_type' => $request->originalShiftType,
                'requested_shift_date' => $request->requestedShiftDate,
                'requested_shift_type' => $request->requestedShiftType,
                'interchange_with' => $colleagueId,
                'peer_status' => $peerStatus,
                'interchange_shift_date' => $isInterchange ? $request->interchangeShiftDate : null,
                'interchange_shift_type' => $isInterchange ? $request->interchangeShiftType : null,
                'reason' => $request->reason,
                'status' => 'pending',
                'notified_to_admin' => $isInterchange ? false : false, // For interchange, wait for peer approval
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            // For time off requests, also create a leave request
            if ($request->requestType === 'time_off') {
                DB::table('leaves_management')->insert([
                    'id' => Str::uuid()->toString(),
                    'user_id' => $userId,
                    'assigner' => $branchId ?? 1,
                    'leave_type_id' => 1, // Default leave type
                    'leaves_start_date' => $request->originalShiftDate,
                    'leaves_end_date' => $request->requestedShiftDate ?? $request->originalShiftDate,
                    'reason' => $request->reason,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            
            // Get request type label for message
            $typeLabels = [
                'change' => 'Schedule Change',
                'interchange' => 'Shift Swap',
                'time_off' => 'Time Off',
                'cancellation' => 'Shift Cancellation'
            ];
            $requestTypeLabel = $typeLabels[$request->requestType] ?? 'Schedule Change';
            
            // Different message for interchange requests
            if ($isInterchange) {
                $colleagueName = DB::table('users')->where('id', $colleagueId)->value('name');
                return response()->json([
                    'status' => 201,
                    'message' => "Shift swap request sent to {$colleagueName}. Once they approve, it will be forwarded to Branch Admin for final approval."
                ]);
            }
            
            return response()->json([
                'status' => 201,
                'message' => "{$requestTypeLabel} request submitted successfully. Your Branch Admin will be notified."
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to submit schedule change request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get colleagues for shift interchange
     * Returns all non-patient users in the same branch
     */
    public function getColleagues(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            $userBranchId = DB::table('users')->where('id', $userId)->value('branch_id');
            
            // Get all non-patient users in the same branch (role_as != 5 is patient)
            // Roles: 1=SuperAdmin, 2=BranchAdmin, 3=Doctor, 4=Nurse, 5=Patient, 6=Cashier, 7=Pharmacist
            $colleagues = DB::table('users')
                ->where('branch_id', $userBranchId)
                ->where('id', '!=', $userId)
                ->whereNotIn('role_as', [5]) // Exclude patients
                ->whereIn('role_as', [3, 4, 6, 7]) // Only Doctor, Nurse, Cashier, Pharmacist (excludes admins)
                ->select('id', 'name', 'first_name', 'last_name', 'role_as')
                ->orderBy('name')
                ->get()
                ->map(function($user) {
                    $roleNames = [
                        1 => 'Super Admin',
                        2 => 'Branch Admin', 
                        3 => 'Doctor',
                        4 => 'Nurse',
                        5 => 'Patient',
                        6 => 'Cashier',
                        7 => 'Pharmacist'
                    ];
                    // Use name if available, otherwise construct from first_name + last_name
                    $displayName = $user->name;
                    if (empty($displayName) && ($user->first_name || $user->last_name)) {
                        $displayName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
                    }
                    if (empty($displayName)) {
                        $displayName = 'Unknown User';
                    }
                    return [
                        'id' => $user->id,
                        'name' => $displayName,
                        'role' => $roleNames[$user->role_as] ?? 'Staff'
                    ];
                })
                ->filter(function($user) {
                    return $user['name'] !== 'Unknown User'; // Filter out users without names
                })
                ->values();
            
            return response()->json([
                'status' => 200,
                'colleagues' => $colleagues
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch colleagues',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get incoming shift swap requests from colleagues
     * Returns requests where the current user is the target of an interchange
     */
    public function getIncomingSwapRequests(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userId = $user->id;
            
            // Get requests where this user is the interchange target
            $incomingRequests = DB::table('schedule_change_requests as scr')
                ->join('users as u', 'scr.user_id', '=', 'u.id')
                ->where('scr.interchange_with', $userId)
                ->where('scr.request_type', 'interchange')
                ->where('scr.peer_status', 'pending')
                ->select(
                    'scr.id',
                    'scr.user_id',
                    'u.name as requester_name',
                    'scr.original_shift_date',
                    'scr.original_shift_type',
                    'scr.interchange_shift_date',
                    'scr.interchange_shift_type',
                    'scr.reason',
                    'scr.peer_status',
                    'scr.status',
                    'scr.created_at'
                )
                ->orderBy('scr.created_at', 'desc')
                ->get()
                ->map(function($req) {
                    return [
                        'id' => $req->id,
                        'requesterId' => $req->user_id,
                        'requesterName' => $req->requester_name,
                        'requesterShiftDate' => $req->original_shift_date,
                        'requesterShiftType' => $req->original_shift_type,
                        'yourShiftDate' => $req->interchange_shift_date,
                        'yourShiftType' => $req->interchange_shift_type,
                        'reason' => $req->reason,
                        'peerStatus' => $req->peer_status,
                        'status' => $req->status,
                        'createdAt' => $req->created_at
                    ];
                });
            
            return response()->json([
                'status' => 200,
                'incomingSwapRequests' => $incomingRequests
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch incoming swap requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Respond to a shift swap request (approve/reject by colleague)
     * After colleague approves, it forwards to branch admin for final approval
     */
    public function respondToSwapRequest(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $request->validate([
                'request_id' => 'required|uuid',
                'action' => 'required|in:approve,reject',
                'rejection_reason' => 'nullable|string'
            ]);
            
            $userId = $user->id;
            $requestId = $request->request_id;
            
            // Get the swap request
            $swapRequest = DB::table('schedule_change_requests')
                ->where('id', $requestId)
                ->where('interchange_with', $userId)
                ->where('request_type', 'interchange')
                ->where('peer_status', 'pending')
                ->first();
            
            if (!$swapRequest) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Swap request not found or already processed'
                ], 404);
            }
            
            if ($request->action === 'approve') {
                // Colleague approves - forward to branch admin
                DB::table('schedule_change_requests')
                    ->where('id', $requestId)
                    ->update([
                        'peer_status' => 'approved',
                        'peer_responded_at' => now(),
                        'notified_to_admin' => false, // Mark for admin notification
                        'updated_at' => now()
                    ]);
                
                return response()->json([
                    'status' => 200,
                    'message' => 'Swap request approved. It will now be sent to Branch Admin for final approval.'
                ]);
            } else {
                // Colleague rejects - close the request
                DB::table('schedule_change_requests')
                    ->where('id', $requestId)
                    ->update([
                        'peer_status' => 'rejected',
                        'peer_responded_at' => now(),
                        'peer_rejection_reason' => $request->rejection_reason ?? 'No reason provided',
                        'status' => 'rejected', // Final status - rejected by peer
                        'updated_at' => now()
                    ]);
                
                return response()->json([
                    'status' => 200,
                    'message' => 'Swap request rejected.'
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to respond to swap request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available shift types for schedule change requests
     */
    public function getShiftTypes(Request $request)
    {
        try {
            $user = $this->validateToken($request);
            if (!$user) {
                return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
            }
            
            $userBranchId = $user->branch_id ?? DB::table('users')->where('id', $user->id)->value('branch_id');
            
            $shiftTypes = [];
            
            // First try to get from shift_management (actual assigned shifts)
            if (DB::getSchemaBuilder()->hasTable('shift_management')) {
                $shifts = DB::table('shift_management')
                    ->where('branch_id', $userBranchId)
                    ->select('shift_type', 'start_time', 'end_time')
                    ->distinct()
                    ->get();
                
                foreach ($shifts as $shift) {
                    if ($shift->shift_type && !in_array($shift->shift_type, array_column($shiftTypes, 'name'))) {
                        $shiftTypes[] = [
                            'id' => $shift->shift_type,
                            'name' => $shift->shift_type,
                            'startTime' => $shift->start_time ?? '08:00',
                            'endTime' => $shift->end_time ?? '17:00'
                        ];
                    }
                }
            }
            
            // Also try shift_definitions if available
            if (empty($shiftTypes) && DB::getSchemaBuilder()->hasTable('shift_definitions')) {
                $definitions = DB::table('shift_definitions')
                    ->where('is_active', true)
                    ->where(function($q) use ($userBranchId) {
                        $q->where('branch_id', $userBranchId)
                          ->orWhereNull('branch_id');
                    })
                    ->orderBy('start_time')
                    ->get();
                
                foreach ($definitions as $def) {
                    $shiftTypes[] = [
                        'id' => $def->id,
                        'name' => $def->shift_name,
                        'startTime' => $def->start_time,
                        'endTime' => $def->end_time
                    ];
                }
            }
            
            // Default fallback
            if (empty($shiftTypes)) {
                $shiftTypes = [
                    ['id' => '1', 'name' => 'Morning', 'startTime' => '06:00', 'endTime' => '14:00'],
                    ['id' => '2', 'name' => 'Evening', 'startTime' => '14:00', 'endTime' => '22:00'],
                    ['id' => '3', 'name' => 'Night', 'startTime' => '22:00', 'endTime' => '06:00']
                ];
            }
            
            // Sort by name
            usort($shiftTypes, fn($a, $b) => strcmp($a['name'], $b['name']));
            
            return response()->json([
                'status' => 200,
                'shiftTypes' => $shiftTypes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch shift types',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
