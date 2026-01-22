<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\AllUsers\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HRMShiftController extends Controller
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
     * Get shift definitions
     * GET /api/hrm/shifts
     */
    public function getShiftDefinitions(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            // Check if shift_definitions table exists
            if (!DB::getSchemaBuilder()->hasTable('shift_definitions')) {
                // Return default shifts
                return response()->json([
                    'status' => 200,
                    'shifts' => $this->getDefaultShifts(),
                    'source' => 'default'
                ]);
            }
            
            $query = DB::table('shift_definitions')
                ->where('is_active', true);
            
            // Filter by branch
            if ($this->isBranchAdmin($user)) {
                $query->where(function($q) use ($user) {
                    $q->where('branch_id', $user->branch_id)
                      ->orWhereNull('branch_id');
                });
            } elseif ($request->has('branch_id') && $request->branch_id !== 'all') {
                $query->where(function($q) use ($request) {
                    $q->where('branch_id', $request->branch_id)
                      ->orWhereNull('branch_id');
                });
            }
            
            $shifts = $query->orderBy('start_time')->get();
            
            if ($shifts->isEmpty()) {
                return response()->json([
                    'status' => 200,
                    'shifts' => $this->getDefaultShifts(),
                    'source' => 'default'
                ]);
            }
            
            return response()->json([
                'status' => 200,
                'shifts' => $shifts,
                'source' => 'database'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch shifts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get default shift definitions
     */
    protected function getDefaultShifts()
    {
        return [
            [
                'id' => 'shift-morning',
                'shift_name' => 'Morning Shift',
                'shift_code' => 'M',
                'start_time' => '06:00:00',
                'end_time' => '14:00:00',
                'standard_hours' => 8,
                'break_duration' => 1,
                'overnight_shift' => false
            ],
            [
                'id' => 'shift-afternoon',
                'shift_name' => 'Afternoon Shift',
                'shift_code' => 'A',
                'start_time' => '14:00:00',
                'end_time' => '22:00:00',
                'standard_hours' => 8,
                'break_duration' => 1,
                'overnight_shift' => false
            ],
            [
                'id' => 'shift-night',
                'shift_name' => 'Night Shift',
                'shift_code' => 'N',
                'start_time' => '22:00:00',
                'end_time' => '06:00:00',
                'standard_hours' => 8,
                'break_duration' => 1,
                'overnight_shift' => true
            ],
            [
                'id' => 'shift-day',
                'shift_name' => 'Day Shift',
                'shift_code' => 'D',
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'standard_hours' => 8,
                'break_duration' => 1,
                'overnight_shift' => false
            ]
        ];
    }

    /**
     * Create shift definition (Super Admin/Branch Admin)
     * POST /api/hrm/shifts
     */
    public function createShift(Request $request)
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
                'shift_name' => 'required|string|max:100',
                'shift_code' => 'nullable|string|max:10',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i',
                'standard_hours' => 'nullable|numeric|min:1|max:12',
                'break_duration' => 'nullable|numeric|min:0|max:2',
                'overnight_shift' => 'nullable|boolean',
                'description' => 'nullable|string|max:500'
            ]);
            
            $shiftId = Str::uuid()->toString();
            $branchId = $this->isBranchAdmin($user) ? $user->branch_id : $request->input('branch_id');
            
            DB::table('shift_definitions')->insert([
                'id' => $shiftId,
                'branch_id' => $branchId,
                'shift_name' => $validated['shift_name'],
                'shift_code' => $validated['shift_code'] ?? strtoupper(substr($validated['shift_name'], 0, 1)),
                'start_time' => $validated['start_time'] . ':00',
                'end_time' => $validated['end_time'] . ':00',
                'standard_hours' => $validated['standard_hours'] ?? 8,
                'break_duration' => $validated['break_duration'] ?? 1,
                'overnight_shift' => $validated['overnight_shift'] ?? false,
                'is_active' => true,
                'description' => $validated['description'] ?? null,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            return response()->json([
                'status' => 201,
                'message' => 'Shift created successfully',
                'shift' => [
                    'id' => $shiftId,
                    'name' => $validated['shift_name']
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
                'message' => 'Failed to create shift',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get employee's assigned shifts
     * GET /api/hrm/employee/shifts
     */
    public function getEmployeeShifts(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $upcoming = collect();
            $history = collect();
            $source = 'legacy';
            $today = now()->format('Y-m-d');
            
            // Try shift_assignments table first
            if (DB::getSchemaBuilder()->hasTable('shift_assignments') && 
                DB::getSchemaBuilder()->hasTable('shift_definitions')) {
                try {
                    $newUpcoming = DB::table('shift_assignments')
                        ->join('shift_definitions', 'shift_assignments.shift_definition_id', '=', 'shift_definitions.id')
                        ->where('shift_assignments.user_id', $user->id)
                        ->where('shift_assignments.effective_from', '>=', $today)
                        ->whereIn('shift_assignments.status', ['pending', 'acknowledged', 'active'])
                        ->select(
                            'shift_assignments.*',
                            'shift_definitions.shift_name',
                            'shift_definitions.shift_code',
                            'shift_definitions.start_time',
                            'shift_definitions.end_time',
                            'shift_definitions.standard_hours'
                        )
                        ->orderBy('shift_assignments.effective_from')
                        ->limit(14)
                        ->get();
                    
                    if ($newUpcoming->isNotEmpty()) {
                        $upcoming = $newUpcoming;
                        $source = 'new';
                    }
                    
                    // Get past shifts
                    $newHistory = DB::table('shift_assignments')
                        ->join('shift_definitions', 'shift_assignments.shift_definition_id', '=', 'shift_definitions.id')
                        ->where('shift_assignments.user_id', $user->id)
                        ->where('shift_assignments.effective_from', '<', $today)
                        ->select(
                            'shift_assignments.*',
                            'shift_definitions.shift_name',
                            'shift_definitions.shift_code',
                            'shift_definitions.start_time',
                            'shift_definitions.end_time'
                        )
                        ->orderBy('shift_assignments.effective_from', 'desc')
                        ->limit(10)
                        ->get();
                    
                    if ($newHistory->isNotEmpty()) {
                        $history = $newHistory;
                    }
                } catch (\Exception $e) {
                    // Fall through to legacy table
                }
            }
            
            // Also get from shift_management table (legacy or fallback)
            if (DB::getSchemaBuilder()->hasTable('shift_management')) {
                $hasStatusColumn = DB::getSchemaBuilder()->hasColumn('shift_management', 'status');
                
                $legacyShifts = DB::table('shift_management')
                    ->where('user_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->get();
                
                // Map legacy shifts to the expected format
                $legacyFormatted = $legacyShifts->map(function($shift) use ($hasStatusColumn) {
                    $status = 'pending';
                    $acknowledged_at = null;
                    
                    if ($hasStatusColumn && isset($shift->status)) {
                        $status = $shift->status;
                        $acknowledged_at = $shift->acknowledged_at ?? null;
                    } else if (isset($shift->notes)) {
                        // Check notes for acknowledgment info
                        $notes = json_decode($shift->notes, true);
                        if (is_array($notes) && !empty($notes['acknowledged'])) {
                            $status = 'acknowledged';
                            $acknowledged_at = $notes['acknowledged_at'] ?? null;
                        }
                    }
                    
                    return (object)[
                        'id' => $shift->id,
                        'shift_definition_id' => $shift->id,
                        'shift_name' => $shift->shift_type,
                        'shift_code' => substr($shift->shift_type ?? 'S', 0, 1),
                        'start_time' => $shift->start_time,
                        'end_time' => $shift->end_time,
                        'effective_from' => $shift->effective_from ?? $shift->created_at,
                        'effective_to' => $shift->effective_to ?? null,
                        'status' => $status,
                        'acknowledged_at' => $acknowledged_at,
                        'notes' => $shift->notes,
                        'branch_id' => $shift->branch_id,
                        'assigned_by' => $shift->assigned_by ?? null,
                        'days_of_week' => $shift->days_of_week,
                        'user_id' => $shift->user_id,
                        'source' => 'shift_management'
                    ];
                });
                
                // Merge with existing upcoming if empty
                if ($upcoming->isEmpty()) {
                    $upcoming = $legacyFormatted->filter(function($s) {
                        return $s->status === 'pending' || $s->status === 'acknowledged' || $s->status === 'active';
                    })->values();
                    $source = 'legacy';
                }
            }
            
            return response()->json([
                'status' => 200,
                'upcoming' => $upcoming,
                'history' => $history,
                'source' => $source
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch shifts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Acknowledge shift assignment
     * PUT /api/hrm/employee/shifts/{id}/acknowledge
     */
    public function acknowledgeShift(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            // First try shift_assignments table
            if (DB::getSchemaBuilder()->hasTable('shift_assignments')) {
                $assignment = DB::table('shift_assignments')
                    ->where('id', $id)
                    ->where('user_id', $user->id)
                    ->first();
                
                if ($assignment) {
                    if ($assignment->status !== 'pending') {
                        return response()->json([
                            'status' => 400,
                            'message' => 'Shift has already been acknowledged'
                        ], 400);
                    }
                    
                    DB::table('shift_assignments')
                        ->where('id', $id)
                        ->update([
                            'status' => 'acknowledged',
                            'acknowledged_at' => now(),
                            'updated_at' => now()
                        ]);
                    
                    return response()->json([
                        'status' => 200,
                        'message' => 'Shift acknowledged successfully'
                    ]);
                }
            }
            
            // Fallback to shift_management table
            if (DB::getSchemaBuilder()->hasTable('shift_management')) {
                $shift = DB::table('shift_management')
                    ->where('id', $id)
                    ->where('user_id', $user->id)
                    ->first();
                
                if ($shift) {
                    // Check if status column exists
                    if (DB::getSchemaBuilder()->hasColumn('shift_management', 'status')) {
                        if (isset($shift->status) && $shift->status !== 'pending') {
                            return response()->json([
                                'status' => 400,
                                'message' => 'Shift has already been acknowledged'
                            ], 400);
                        }
                        
                        DB::table('shift_management')
                            ->where('id', $id)
                            ->update([
                                'status' => 'acknowledged',
                                'acknowledged_at' => now(),
                                'updated_at' => now()
                            ]);
                    } else {
                        // If status column doesn't exist yet, update notes to track acknowledgment
                        $notes = $shift->notes ?? '';
                        $notesData = json_decode($notes, true) ?? [];
                        $notesData['acknowledged'] = true;
                        $notesData['acknowledged_at'] = now()->toDateTimeString();
                        
                        DB::table('shift_management')
                            ->where('id', $id)
                            ->update([
                                'notes' => json_encode($notesData),
                                'updated_at' => now()
                            ]);
                    }
                    
                    return response()->json([
                        'status' => 200,
                        'message' => 'Shift acknowledged successfully'
                    ]);
                }
            }
            
            return response()->json([
                'status' => 404,
                'message' => 'Shift assignment not found'
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
     * Assign shift to employee (Branch Admin)
     * POST /api/hrm/branch-admin/assign-shift
     */
    public function assignShift(Request $request)
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
                'shift_definition_id' => 'required|string',
                'effective_from' => 'required|date|after_or_equal:today',
                'effective_to' => 'nullable|date|after:effective_from',
                'notes' => 'nullable|string|max:500'
            ]);
            
            $employee = User::find($validated['user_id']);
            
            // Branch Admin can only assign to their branch staff
            if ($this->isBranchAdmin($user) && $employee->branch_id !== $user->branch_id) {
                return response()->json([
                    'status' => 403,
                    'message' => 'You can only assign shifts to your branch staff'
                ], 403);
            }
            
            $assignmentId = Str::uuid()->toString();
            
            DB::table('shift_assignments')->insert([
                'id' => $assignmentId,
                'user_id' => $validated['user_id'],
                'shift_definition_id' => $validated['shift_definition_id'],
                'branch_id' => $employee->branch_id,
                'assigned_by' => $user->id,
                'effective_from' => $validated['effective_from'],
                'effective_to' => $validated['effective_to'] ?? null,
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            return response()->json([
                'status' => 201,
                'message' => 'Shift assigned successfully',
                'assignment' => [
                    'id' => $assignmentId,
                    'userId' => $validated['user_id'],
                    'effectiveFrom' => $validated['effective_from']
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
                'message' => 'Failed to assign shift',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get branch shift schedule (Branch Admin)
     * GET /api/hrm/branch-admin/shift-schedule
     */
    public function getBranchShiftSchedule(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $branchId = $this->isBranchAdmin($user) ? $user->branch_id : $request->input('branch_id');
            $startDate = $request->input('start_date', now()->startOfWeek()->format('Y-m-d'));
            $endDate = $request->input('end_date', now()->endOfWeek()->format('Y-m-d'));
            
            // Get from legacy shift_management table
            $schedule = DB::table('shift_management')
                ->join('users', 'shift_management.user_id', '=', 'users.id')
                ->where('shift_management.branch_id', $branchId)
                ->select(
                    'shift_management.*',
                    'users.first_name',
                    'users.last_name',
                    'users.role_as'
                )
                ->orderBy('users.first_name')
                ->get();
            
            $roles = [
                1 => 'Super Admin', 2 => 'Branch Admin', 3 => 'Doctor',
                4 => 'Pharmacist', 5 => 'Nurse', 7 => 'Cashier',
                9 => 'IT Support', 10 => 'Center Aid', 11 => 'Auditor'
            ];
            
            $formattedSchedule = $schedule->map(function($s) use ($roles) {
                return [
                    'id' => $s->id,
                    'userId' => $s->user_id,
                    'name' => $s->first_name . ' ' . $s->last_name,
                    'role' => $roles[$s->role_as] ?? 'Staff',
                    'shiftType' => $s->shift_type,
                    'daysOfWeek' => $s->days_of_week,
                    'startTime' => $s->start_time,
                    'endTime' => $s->end_time,
                    'notes' => $s->notes
                ];
            });
            
            // Fetch approved schedule overrides for this branch and date range
            $overrides = collect();
            if (DB::getSchemaBuilder()->hasTable('employee_schedule_overrides')) {
                $overrides = DB::table('employee_schedule_overrides as eso')
                    ->join('users as u', 'eso.user_id', '=', 'u.id')
                    ->where('eso.branch_id', $branchId)
                    ->where('eso.status', 'active')
                    ->whereBetween('eso.override_date', [$startDate, $endDate])
                    ->select(
                        'eso.*',
                        'u.first_name',
                        'u.last_name'
                    )
                    ->get();
            }
            
            $formattedOverrides = $overrides->map(function($o) {
                return [
                    'id' => $o->id,
                    'userId' => $o->user_id,
                    'userName' => $o->first_name . ' ' . $o->last_name,
                    'date' => $o->override_date,
                    'type' => $o->override_type,
                    'originalShiftType' => $o->original_shift_type,
                    'newShiftType' => $o->new_shift_type,
                    'newStartTime' => $o->new_start_time,
                    'newEndTime' => $o->new_end_time,
                    'reason' => $o->reason,
                    'status' => $o->status,
                    'interchangeWithUserId' => $o->interchange_with_user_id
                ];
            });
            
            return response()->json([
                'status' => 200,
                'schedule' => $formattedSchedule,
                'overrides' => $formattedOverrides,
                'period' => [
                    'start' => $startDate,
                    'end' => $endDate
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch shift schedule',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get all schedule change requests for branch admin
     * GET /api/hrm/branch-admin/schedule-requests
     */
    public function getScheduleChangeRequests(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            // Use SQLite-compatible string concatenation
            $driver = DB::connection()->getDriverName();
            $concatRequester = $driver === 'sqlite' 
                ? "(requester.first_name || ' ' || requester.last_name)" 
                : "CONCAT(requester.first_name, ' ', requester.last_name)";
            $concatInterchange = $driver === 'sqlite'
                ? "(interchange_user.first_name || ' ' || interchange_user.last_name)"
                : "CONCAT(interchange_user.first_name, ' ', interchange_user.last_name)";
            $concatResponder = $driver === 'sqlite'
                ? "(responder.first_name || ' ' || responder.last_name)"
                : "CONCAT(responder.first_name, ' ', responder.last_name)";
            
            $query = DB::table('schedule_change_requests as scr')
                ->join('users as requester', 'scr.user_id', '=', 'requester.id')
                ->leftJoin('users as interchange_user', 'scr.interchange_with', '=', 'interchange_user.id')
                ->leftJoin('users as responder', 'scr.responded_by', '=', 'responder.id')
                ->select(
                    'scr.*',
                    DB::raw("{$concatRequester} as requester_name"),
                    'requester.role_as as requester_role',
                    DB::raw("{$concatInterchange} as interchange_with_name"),
                    DB::raw("{$concatResponder} as responder_name")
                );
            
            // Filter by branch for branch admin
            if ($this->isBranchAdmin($user)) {
                $query->where('scr.branch_id', $user->branch_id);
            } elseif ($request->has('branch_id') && $request->branch_id !== 'all') {
                $query->where('scr.branch_id', $request->branch_id);
            }
            
            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('scr.status', $request->status);
            }
            
            $requests = $query->orderByRaw("CASE WHEN scr.status = 'pending' THEN 0 ELSE 1 END")
                ->orderBy('scr.created_at', 'desc')
                ->get();
            
            // Mark as notified
            $pendingIds = $requests->where('status', 'pending')->where('notified_to_admin', false)->pluck('id');
            if ($pendingIds->count() > 0) {
                DB::table('schedule_change_requests')
                    ->whereIn('id', $pendingIds)
                    ->update(['notified_to_admin' => true]);
            }
            
            // Count pending requests for notification badge
            $pendingCount = $requests->where('status', 'pending')->count();
            
            $roleNames = [
                1 => 'Super Admin', 2 => 'Branch Admin', 3 => 'Doctor',
                4 => 'Pharmacist', 5 => 'Nurse', 7 => 'Cashier',
                9 => 'IT Support', 10 => 'Center Aid', 11 => 'Auditor'
            ];
            
            $formattedRequests = $requests->map(function($r) use ($roleNames) {
                return [
                    'id' => $r->id,
                    'userId' => $r->user_id,
                    'requesterName' => $r->requester_name,
                    'requesterRole' => $roleNames[$r->requester_role] ?? 'Staff',
                    'requestType' => $r->request_type,
                    'originalShiftDate' => $r->original_shift_date,
                    'originalShiftType' => $r->original_shift_type,
                    'requestedShiftDate' => $r->requested_shift_date,
                    'requestedShiftType' => $r->requested_shift_type,
                    'interchangeWith' => $r->interchange_with,
                    'interchangeWithName' => $r->interchange_with_name,
                    'reason' => $r->reason,
                    'status' => $r->status,
                    'respondedBy' => $r->responder_name,
                    'respondedAt' => $r->responded_at,
                    'rejectionReason' => $r->rejection_reason,
                    'createdAt' => $r->created_at
                ];
            });
            
            return response()->json([
                'status' => 200,
                'requests' => $formattedRequests,
                'pendingCount' => $pendingCount
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
     * Respond to a schedule change request
     * POST /api/hrm/branch-admin/schedule-requests/{id}/respond
     */
    public function respondToScheduleChangeRequest(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $request->validate([
                'action' => 'required|in:approve,reject',
                'rejection_reason' => 'required_if:action,reject|string|nullable'
            ]);
            
            $scheduleRequest = DB::table('schedule_change_requests')
                ->where('id', $id)
                ->first();
            
            if (!$scheduleRequest) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Schedule change request not found'
                ], 404);
            }
            
            // Branch admin can only respond to their branch requests
            if ($this->isBranchAdmin($user) && $scheduleRequest->branch_id !== $user->branch_id) {
                return response()->json([
                    'status' => 403,
                    'message' => 'You can only respond to requests from your branch'
                ], 403);
            }
            
            $status = $request->action === 'approve' ? 'approved' : 'rejected';
            
            DB::table('schedule_change_requests')
                ->where('id', $id)
                ->update([
                    'status' => $status,
                    'responded_by' => $user->id,
                    'responded_at' => now(),
                    'rejection_reason' => $request->action === 'reject' ? $request->rejection_reason : null,
                    'updated_at' => now()
                ]);
            
            // If approved and it's a cancellation, update the shift status
            if ($status === 'approved' && $scheduleRequest->request_type === 'cancellation') {
                // Mark the shift as cancelled if it exists
                DB::table('shift_management')
                    ->where('user_id', $scheduleRequest->user_id)
                    ->where('start_date', $scheduleRequest->original_shift_date)
                    ->update(['status' => 'cancelled', 'updated_at' => now()]);
            }
            
            $typeLabels = [
                'change' => 'Schedule Change',
                'interchange' => 'Shift Swap',
                'time_off' => 'Time Off',
                'cancellation' => 'Shift Cancellation'
            ];
            $requestTypeLabel = $typeLabels[$scheduleRequest->request_type] ?? 'Schedule Change';
            
            return response()->json([
                'status' => 200,
                'message' => "{$requestTypeLabel} request has been {$status}"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to respond to schedule change request',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get pending schedule request count for notification badge
     * GET /api/hrm/branch-admin/schedule-requests/pending-count
     */
    public function getPendingScheduleRequestCount(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $query = DB::table('schedule_change_requests')
                ->where('status', 'pending');
            
            if ($this->isBranchAdmin($user)) {
                $query->where('branch_id', $user->branch_id);
            }
            
            $count = $query->count();
            $newCount = $query->where('notified_to_admin', false)->count();
            
            return response()->json([
                'status' => 200,
                'pendingCount' => $count,
                'newCount' => $newCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get pending count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get public holidays for Sri Lanka
     * GET /api/hrm/holidays/{year}
     * Proxies external APIs to avoid CORS issues
     */
    public function getPublicHolidays(Request $request, $year = null)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        $year = $year ?? date('Y');
        
        // Sri Lankan Public Holidays - comprehensive local data
        $holidays = $this->getSriLankanHolidays($year);
        
        // Try to fetch from external API (Nager.Date)
        try {
            $client = new \GuzzleHttp\Client(['timeout' => 5]);
            $response = $client->get("https://date.nager.at/api/v3/PublicHolidays/{$year}/LK");
            
            if ($response->getStatusCode() === 200) {
                $apiHolidays = json_decode($response->getBody(), true);
                
                if (is_array($apiHolidays) && count($apiHolidays) > 0) {
                    $holidays = array_map(function($h) {
                        return [
                            'date' => $h['date'],
                            'name' => $h['localName'] ?? $h['name']
                        ];
                    }, $apiHolidays);
                    
                    return response()->json([
                        'status' => 200,
                        'source' => 'api',
                        'year' => $year,
                        'holidays' => $holidays
                    ]);
                }
            }
        } catch (\Exception $e) {
            // API failed, use local data
            \Log::info("Holiday API failed, using local data: " . $e->getMessage());
        }
        
        return response()->json([
            'status' => 200,
            'source' => 'local',
            'year' => $year,
            'holidays' => $holidays
        ]);
    }
    
    /**
     * Get Sri Lankan holidays for a given year
     */
    private function getSriLankanHolidays($year)
    {
        // 2026 Sri Lankan Public Holidays
        if ($year == 2026) {
            return [
                ['date' => '2026-01-03', 'name' => 'Duruthu Full Moon Poya Day'],
                ['date' => '2026-01-14', 'name' => 'Thai Pongal'],
                ['date' => '2026-02-01', 'name' => 'Navam Full Moon Poya Day'],
                ['date' => '2026-02-04', 'name' => 'Independence Day'],
                ['date' => '2026-03-03', 'name' => 'Madin Full Moon Poya Day'],
                ['date' => '2026-03-20', 'name' => 'Id-Ul-Fitr (Ramazan Festival Day)'],
                ['date' => '2026-04-01', 'name' => 'Bak Full Moon Poya Day'],
                ['date' => '2026-04-03', 'name' => 'Good Friday'],
                ['date' => '2026-04-13', 'name' => 'Day prior to Sinhala & Tamil New Year Day'],
                ['date' => '2026-04-14', 'name' => 'Sinhala & Tamil New Year Day'],
                ['date' => '2026-05-01', 'name' => 'May Day'],
                ['date' => '2026-05-01', 'name' => 'Vesak Full Moon Poya Day'],
                ['date' => '2026-05-02', 'name' => 'Day following Vesak Full Moon Poya Day'],
                ['date' => '2026-05-27', 'name' => 'Id-Ul-Alha (Hadji Festival Day)'],
                ['date' => '2026-05-30', 'name' => 'Poson Full Moon Poya Day'],
                ['date' => '2026-06-29', 'name' => 'Esala Full Moon Poya Day'],
                ['date' => '2026-07-28', 'name' => 'Nikini Full Moon Poya Day'],
                ['date' => '2026-08-26', 'name' => "Milad-Un-Nabi (Holy Prophet's Birthday)"],
                ['date' => '2026-08-27', 'name' => 'Binara Full Moon Poya Day'],
                ['date' => '2026-09-25', 'name' => 'Vap Full Moon Poya Day'],
                ['date' => '2026-10-25', 'name' => 'Il Full Moon Poya Day'],
                ['date' => '2026-11-12', 'name' => 'Deepavali Festival Day'],
                ['date' => '2026-11-24', 'name' => 'Unduvap Full Moon Poya Day'],
                ['date' => '2026-12-25', 'name' => 'Christmas Day'],
            ];
        }
        
        // 2025 Sri Lankan Public Holidays
        if ($year == 2025) {
            return [
                ['date' => '2025-01-14', 'name' => 'Thai Pongal'],
                ['date' => '2025-01-15', 'name' => 'Duruthu Full Moon Poya Day'],
                ['date' => '2025-02-04', 'name' => 'Independence Day'],
                ['date' => '2025-02-12', 'name' => 'Navam Full Moon Poya Day'],
                ['date' => '2025-03-14', 'name' => 'Maha Shivarathri Day'],
                ['date' => '2025-03-14', 'name' => 'Madin Full Moon Poya Day'],
                ['date' => '2025-03-31', 'name' => 'Id-Ul-Fitr (Ramazan Festival Day)'],
                ['date' => '2025-04-12', 'name' => 'Bak Full Moon Poya Day'],
                ['date' => '2025-04-13', 'name' => 'Day prior to Sinhala & Tamil New Year Day'],
                ['date' => '2025-04-14', 'name' => 'Sinhala & Tamil New Year Day'],
                ['date' => '2025-04-18', 'name' => 'Good Friday'],
                ['date' => '2025-05-01', 'name' => 'May Day'],
                ['date' => '2025-05-12', 'name' => 'Vesak Full Moon Poya Day'],
                ['date' => '2025-05-13', 'name' => 'Day following Vesak Full Moon Poya Day'],
                ['date' => '2025-06-07', 'name' => 'Id-Ul-Alha (Hadji Festival Day)'],
                ['date' => '2025-06-10', 'name' => 'Poson Full Moon Poya Day'],
                ['date' => '2025-07-09', 'name' => 'Esala Full Moon Poya Day'],
                ['date' => '2025-08-08', 'name' => 'Nikini Full Moon Poya Day'],
                ['date' => '2025-09-06', 'name' => 'Binara Full Moon Poya Day'],
                ['date' => '2025-09-06', 'name' => "Milad-Un-Nabi (Holy Prophet's Birthday)"],
                ['date' => '2025-10-06', 'name' => 'Vap Full Moon Poya Day'],
                ['date' => '2025-10-23', 'name' => 'Deepavali Festival Day'],
                ['date' => '2025-11-04', 'name' => 'Il Full Moon Poya Day'],
                ['date' => '2025-12-04', 'name' => 'Unduvap Full Moon Poya Day'],
                ['date' => '2025-12-25', 'name' => 'Christmas Day'],
            ];
        }
        
        // Default/generic holidays (major ones that don't change much)
        return [
            ['date' => "{$year}-01-14", 'name' => 'Thai Pongal'],
            ['date' => "{$year}-02-04", 'name' => 'Independence Day'],
            ['date' => "{$year}-04-13", 'name' => 'Day prior to Sinhala & Tamil New Year Day'],
            ['date' => "{$year}-04-14", 'name' => 'Sinhala & Tamil New Year Day'],
            ['date' => "{$year}-05-01", 'name' => 'May Day'],
            ['date' => "{$year}-12-25", 'name' => 'Christmas Day'],
        ];
    }
}