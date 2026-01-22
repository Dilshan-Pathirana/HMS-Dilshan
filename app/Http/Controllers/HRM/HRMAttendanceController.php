<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\AllUsers\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HRMAttendanceController extends Controller
{
    /**
     * Get the authenticated user
     */
    protected function getAuthenticatedUser(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }
        
        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
        if (!$accessToken) {
            return null;
        }
        
        return $accessToken->tokenable;
    }
    
    protected function isSuperAdmin($user): bool
    {
        return $user && $user->role_as === 1;
    }
    
    protected function isBranchAdmin($user): bool
    {
        return $user && $user->role_as === 2;
    }
    
    protected function hasHRAccess($user): bool
    {
        return $this->isSuperAdmin($user) || $this->isBranchAdmin($user);
    }

    /**
     * Get employee attendance for current month
     * GET /api/hrm/employee/attendance
     */
    public function getEmployeeAttendance(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $month = $request->input('month', now()->format('Y-m'));
            
            // Check if new attendance_records table exists
            if (DB::getSchemaBuilder()->hasTable('attendance_records')) {
                $attendance = DB::table('attendance_records')
                    ->where('user_id', $user->id)
                    ->whereRaw("strftime('%Y-%m', attendance_date) = ?", [$month])
                    ->orderBy('attendance_date', 'desc')
                    ->get();
                
                // Calculate summary
                $summary = [
                    'present' => $attendance->where('status', 'present')->count(),
                    'late' => $attendance->where('status', 'late')->count(),
                    'absent' => $attendance->where('status', 'absent')->count(),
                    'leave' => $attendance->where('status', 'leave')->count(),
                    'halfDay' => $attendance->where('status', 'half_day')->count(),
                    'totalHours' => $attendance->sum('actual_hours'),
                    'overtimeHours' => $attendance->sum('overtime_hours')
                ];
                
                return response()->json([
                    'status' => 200,
                    'month' => $month,
                    'summary' => $summary,
                    'records' => $attendance
                ]);
            }
            
            // Fallback to legacy attendance table
            $attendance = DB::table('attendance')
                ->where('user_id', $user->id)
                ->whereRaw("strftime('%Y-%m', date) = ?", [$month])
                ->orderBy('date', 'desc')
                ->get();
            
            return response()->json([
                'status' => 200,
                'month' => $month,
                'records' => $attendance,
                'source' => 'legacy'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get branch daily attendance (Branch Admin)
     * GET /api/hrm/branch-admin/attendance
     */
    public function getBranchAttendance(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $date = $request->input('date', now()->format('Y-m-d'));
            $branchId = $this->isBranchAdmin($user) ? $user->branch_id : $request->input('branch_id');
            
            // Get all staff for the branch
            $staff = User::where('branch_id', $branchId)
                ->where('is_active', 1)
                ->where('role_as', '!=', 6) // Exclude patients
                ->select('id', 'first_name', 'last_name', 'role_as')
                ->get();
            
            // Get attendance records for the date
            $attendanceRecords = [];
            if (DB::getSchemaBuilder()->hasTable('attendance_records')) {
                $attendanceRecords = DB::table('attendance_records')
                    ->where('branch_id', $branchId)
                    ->where('attendance_date', $date)
                    ->get()
                    ->keyBy('user_id');
            }
            
            // Get leaves for the date
            $leavesOnDate = DB::table('leaves_management')
                ->where('status', 'Approved')
                ->where('leaves_start_date', '<=', $date)
                ->where('leaves_end_date', '>=', $date)
                ->pluck('user_id')
                ->toArray();
            
            $roles = [
                1 => 'Super Admin', 2 => 'Branch Admin', 3 => 'Doctor',
                4 => 'Pharmacist', 5 => 'Nurse', 7 => 'Cashier',
                9 => 'IT Support', 10 => 'Center Aid', 11 => 'Auditor'
            ];
            
            $attendance = $staff->map(function($s) use ($attendanceRecords, $leavesOnDate, $roles) {
                $record = $attendanceRecords->get($s->id);
                $onLeave = in_array($s->id, $leavesOnDate);
                
                return [
                    'userId' => $s->id,
                    'name' => $s->first_name . ' ' . $s->last_name,
                    'role' => $roles[$s->role_as] ?? 'Staff',
                    'status' => $onLeave ? 'leave' : ($record ? $record->status : 'pending'),
                    'clockIn' => $record ? $record->clock_in : null,
                    'clockOut' => $record ? $record->clock_out : null,
                    'actualHours' => $record ? $record->actual_hours : 0,
                    'lateMinutes' => $record ? $record->late_minutes : 0,
                    'onLeave' => $onLeave
                ];
            });
            
            // Calculate summary
            $summary = [
                'total' => $staff->count(),
                'present' => $attendance->where('status', 'present')->count(),
                'late' => $attendance->where('status', 'late')->count(),
                'absent' => $attendance->where('status', 'absent')->count(),
                'leave' => $attendance->where('status', 'leave')->count() + count($leavesOnDate),
                'pending' => $attendance->where('status', 'pending')->count()
            ];
            
            return response()->json([
                'status' => 200,
                'date' => $date,
                'summary' => $summary,
                'attendance' => $attendance
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Record attendance (Branch Admin manual entry)
     * POST /api/hrm/branch-admin/attendance
     */
    public function recordAttendance(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $validated = $request->validate([
                'user_id' => 'required|uuid|exists:users,id',
                'date' => 'required|date|before_or_equal:today',
                'clock_in' => 'nullable|date_format:H:i',
                'clock_out' => 'nullable|date_format:H:i|after:clock_in',
                'status' => 'required|in:present,absent,late,half_day,leave,holiday,weekend',
                'notes' => 'nullable|string|max:500'
            ]);
            
            $employee = User::find($validated['user_id']);
            
            // Branch Admin can only record for their branch
            if ($this->isBranchAdmin($user) && $employee->branch_id !== $user->branch_id) {
                return response()->json([
                    'status' => 403,
                    'message' => 'You can only record attendance for your branch staff'
                ], 403);
            }
            
            // Calculate hours if clock in/out provided
            $actualHours = 0;
            if ($validated['clock_in'] && $validated['clock_out']) {
                $clockIn = \Carbon\Carbon::parse($validated['clock_in']);
                $clockOut = \Carbon\Carbon::parse($validated['clock_out']);
                $actualHours = $clockIn->diffInMinutes($clockOut) / 60;
            }
            
            // Check if record exists
            $existing = DB::table('attendance_records')
                ->where('user_id', $validated['user_id'])
                ->where('attendance_date', $validated['date'])
                ->first();
            
            $recordData = [
                'user_id' => $validated['user_id'],
                'branch_id' => $employee->branch_id,
                'attendance_date' => $validated['date'],
                'clock_in' => $validated['clock_in'] ? $validated['clock_in'] . ':00' : null,
                'clock_out' => $validated['clock_out'] ? $validated['clock_out'] . ':00' : null,
                'actual_hours' => $actualHours,
                'status' => $validated['status'],
                'clock_in_method' => 'manual',
                'notes' => $validated['notes'] ?? null,
                'recorded_by' => $user->id,
                'updated_at' => now()
            ];
            
            if ($existing) {
                DB::table('attendance_records')
                    ->where('id', $existing->id)
                    ->update($recordData);
                $recordId = $existing->id;
            } else {
                $recordId = Str::uuid()->toString();
                $recordData['id'] = $recordId;
                $recordData['created_at'] = now();
                DB::table('attendance_records')->insert($recordData);
            }
            
            return response()->json([
                'status' => 201,
                'message' => 'Attendance recorded successfully',
                'record' => [
                    'id' => $recordId,
                    'userId' => $validated['user_id'],
                    'date' => $validated['date'],
                    'status' => $validated['status']
                ]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to record attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance report (Branch Admin/Super Admin)
     * GET /api/hrm/branch-admin/attendance-report
     */
    public function getAttendanceReport(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $month = $request->input('month', now()->format('Y-m'));
            $branchId = $this->isBranchAdmin($user) ? $user->branch_id : $request->input('branch_id');
            
            // Get all staff for the branch
            $staffQuery = User::where('is_active', 1)
                ->where('role_as', '!=', 6);
            
            if ($branchId) {
                $staffQuery->where('branch_id', $branchId);
            }
            
            $staff = $staffQuery->get();
            
            // Get attendance summary for each staff member
            $report = [];
            $roles = [
                1 => 'Super Admin', 2 => 'Branch Admin', 3 => 'Doctor',
                4 => 'Pharmacist', 5 => 'Nurse', 7 => 'Cashier',
                9 => 'IT Support', 10 => 'Center Aid', 11 => 'Auditor'
            ];
            
            // Calculate working days in month (excluding weekends)
            $startDate = \Carbon\Carbon::parse($month . '-01');
            $endDate = $startDate->copy()->endOfMonth();
            $workingDays = 0;
            $current = $startDate->copy();
            while ($current <= $endDate) {
                if (!$current->isWeekend()) {
                    $workingDays++;
                }
                $current->addDay();
            }
            
            foreach ($staff as $s) {
                // Get attendance counts
                $attendanceStats = [];
                if (DB::getSchemaBuilder()->hasTable('attendance_records')) {
                    $attendanceStats = DB::table('attendance_records')
                        ->where('user_id', $s->id)
                        ->whereRaw("strftime('%Y-%m', attendance_date) = ?", [$month])
                        ->select(
                            DB::raw("SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present"),
                            DB::raw("SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late"),
                            DB::raw("SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent"),
                            DB::raw("SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_day"),
                            DB::raw("SUM(actual_hours) as total_hours"),
                            DB::raw("SUM(overtime_hours) as overtime_hours")
                        )
                        ->first();
                }
                
                // Get leaves
                $leaveCount = DB::table('leaves_management')
                    ->where('user_id', $s->id)
                    ->where('status', 'Approved')
                    ->whereRaw("strftime('%Y-%m', leaves_start_date) = ? OR strftime('%Y-%m', leaves_end_date) = ?", [$month, $month])
                    ->sum('leaves_days');
                
                $report[] = [
                    'userId' => $s->id,
                    'name' => $s->first_name . ' ' . $s->last_name,
                    'role' => $roles[$s->role_as] ?? 'Staff',
                    'workingDays' => $workingDays,
                    'present' => (int)($attendanceStats->present ?? 0),
                    'late' => (int)($attendanceStats->late ?? 0),
                    'absent' => (int)($attendanceStats->absent ?? 0),
                    'halfDay' => (int)($attendanceStats->half_day ?? 0),
                    'leave' => (int)$leaveCount,
                    'totalHours' => round($attendanceStats->total_hours ?? 0, 2),
                    'overtimeHours' => round($attendanceStats->overtime_hours ?? 0, 2),
                    'attendanceRate' => $workingDays > 0 
                        ? round((($attendanceStats->present ?? 0) / $workingDays) * 100, 1) 
                        : 0
                ];
            }
            
            return response()->json([
                'status' => 200,
                'month' => $month,
                'workingDays' => $workingDays,
                'report' => $report
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to generate attendance report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
