<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\AllUsers\User;
use App\Models\LeavesManagement\LeavesManagement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HRMLeaveController extends Controller
{
    /**
     * Get the authenticated user with role validation
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
     * Get leave types configuration
     * GET /api/hrm/leave-types
     */
    public function getLeaveTypes(Request $request)
    {
        // Sri Lanka standard leave types
        $leaveTypes = [
            [
                'id' => 'annual',
                'name' => 'Annual Leave',
                'quota' => 14,
                'carryForward' => true,
                'maxCarryForward' => 7,
                'paidLeave' => true
            ],
            [
                'id' => 'casual',
                'name' => 'Casual Leave',
                'quota' => 7,
                'carryForward' => false,
                'maxCarryForward' => 0,
                'paidLeave' => true
            ],
            [
                'id' => 'sick',
                'name' => 'Sick Leave',
                'quota' => 7,
                'carryForward' => false,
                'maxCarryForward' => 0,
                'paidLeave' => true
            ],
            [
                'id' => 'maternity',
                'name' => 'Maternity Leave',
                'quota' => 84, // 12 weeks
                'carryForward' => false,
                'maxCarryForward' => 0,
                'paidLeave' => true,
                'eligibility' => 'female'
            ],
            [
                'id' => 'paternity',
                'name' => 'Paternity Leave',
                'quota' => 3,
                'carryForward' => false,
                'maxCarryForward' => 0,
                'paidLeave' => true,
                'eligibility' => 'male'
            ],
            [
                'id' => 'no_pay',
                'name' => 'No Pay Leave',
                'quota' => 30,
                'carryForward' => false,
                'maxCarryForward' => 0,
                'paidLeave' => false
            ]
        ];
        
        return response()->json([
            'status' => 200,
            'leaveTypes' => $leaveTypes
        ]);
    }

    /**
     * Get employee leave balance
     * GET /api/hrm/employee/leave-balance
     */
    public function getLeaveBalance(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $currentYear = now()->format('Y');
            
            // Get used leaves by type (simplified - all grouped as annual for now)
            $usedLeaves = DB::table('leaves_management')
                ->where('user_id', $user->id)
                ->where('status', 'Approved')
                ->whereRaw("strftime('%Y', leaves_start_date) = ?", [$currentYear])
                ->sum('leaves_days');
            
            $pendingLeaves = DB::table('leaves_management')
                ->where('user_id', $user->id)
                ->where('status', 'Pending')
                ->whereRaw("strftime('%Y', leaves_start_date) = ?", [$currentYear])
                ->sum('leaves_days');
            
            // Standard quotas
            $annualQuota = 14;
            $casualQuota = 7;
            $sickQuota = 7;
            
            $balance = [
                'annual' => [
                    'total' => $annualQuota,
                    'used' => (int)$usedLeaves,
                    'pending' => (int)$pendingLeaves,
                    'remaining' => max(0, $annualQuota - $usedLeaves)
                ],
                'casual' => [
                    'total' => $casualQuota,
                    'used' => 0,
                    'pending' => 0,
                    'remaining' => $casualQuota
                ],
                'sick' => [
                    'total' => $sickQuota,
                    'used' => 0,
                    'pending' => 0,
                    'remaining' => $sickQuota
                ]
            ];
            
            return response()->json([
                'status' => 200,
                'balance' => $balance,
                'year' => $currentYear
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch leave balance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get employee leave history
     * GET /api/hrm/employee/leave-history
     */
    public function getLeaveHistory(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $query = DB::table('leaves_management')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc');
            
            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }
            
            // Filter by year
            if ($request->has('year')) {
                $query->whereRaw("strftime('%Y', leaves_start_date) = ?", [$request->year]);
            }
            
            $leaves = $query->paginate(10);
            
            return response()->json([
                'status' => 200,
                'leaves' => $leaves->items(),
                'pagination' => [
                    'total' => $leaves->total(),
                    'perPage' => $leaves->perPage(),
                    'currentPage' => $leaves->currentPage(),
                    'lastPage' => $leaves->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch leave history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Apply for leave
     * POST /api/hrm/employee/apply-leave
     */
    public function applyLeave(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $validated = $request->validate([
                'leave_type' => 'required|string',
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after_or_equal:start_date',
                'reason' => 'required|string|max:500'
            ]);
            
            // Calculate leave days
            $startDate = \Carbon\Carbon::parse($validated['start_date']);
            $endDate = \Carbon\Carbon::parse($validated['end_date']);
            $leaveDays = $startDate->diffInDays($endDate) + 1;
            
            // Check for overlapping leaves
            $overlapping = DB::table('leaves_management')
                ->where('user_id', $user->id)
                ->whereIn('status', ['Pending', 'Approved'])
                ->where(function($q) use ($startDate, $endDate) {
                    $q->whereBetween('leaves_start_date', [$startDate, $endDate])
                      ->orWhereBetween('leaves_end_date', [$startDate, $endDate])
                      ->orWhere(function($q2) use ($startDate, $endDate) {
                          $q2->where('leaves_start_date', '<=', $startDate)
                             ->where('leaves_end_date', '>=', $endDate);
                      });
                })
                ->exists();
            
            if ($overlapping) {
                return response()->json([
                    'status' => 400,
                    'message' => 'You already have a leave request for this period'
                ], 400);
            }
            
            // Create leave request
            $leaveId = Str::uuid()->toString();
            DB::table('leaves_management')->insert([
                'id' => $leaveId,
                'user_id' => $user->id,
                'leaves_start_date' => $validated['start_date'],
                'leaves_end_date' => $validated['end_date'],
                'leaves_days' => $leaveDays,
                'reason' => $validated['reason'],
                'status' => 'Pending',
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            return response()->json([
                'status' => 201,
                'message' => 'Leave request submitted successfully',
                'leave' => [
                    'id' => $leaveId,
                    'startDate' => $validated['start_date'],
                    'endDate' => $validated['end_date'],
                    'days' => $leaveDays,
                    'status' => 'Pending'
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
                'message' => 'Failed to submit leave request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel leave request (employee)
     * DELETE /api/hrm/employee/leave/{id}
     */
    public function cancelLeave(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $leave = DB::table('leaves_management')
                ->where('id', $id)
                ->where('user_id', $user->id)
                ->first();
            
            if (!$leave) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Leave request not found'
                ], 404);
            }
            
            if ($leave->status !== 'Pending') {
                return response()->json([
                    'status' => 400,
                    'message' => 'Only pending leave requests can be cancelled'
                ], 400);
            }
            
            DB::table('leaves_management')
                ->where('id', $id)
                ->update([
                    'status' => 'Cancelled',
                    'updated_at' => now()
                ]);
            
            return response()->json([
                'status' => 200,
                'message' => 'Leave request cancelled successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to cancel leave request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending leave requests for approval (Branch Admin)
     * GET /api/hrm/branch-admin/pending-leaves
     */
    public function getPendingLeaves(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $query = DB::table('leaves_management')
                ->join('users', 'leaves_management.user_id', '=', 'users.id')
                ->leftJoin('branches', 'users.branch_id', '=', 'branches.id')
                ->leftJoin('leave_types', 'leaves_management.leave_type_id', '=', 'leave_types.id');
            
            // Branch Admin can only see their branch
            if ($this->isBranchAdmin($user)) {
                $query->where('users.branch_id', $user->branch_id);
            } elseif ($request->has('branch_id') && $request->branch_id !== 'all') {
                $query->where('users.branch_id', $request->branch_id);
            }
            
            // Filter by status (default: Pending)
            $status = $request->input('status', 'Pending');
            if ($status !== 'all') {
                $query->where('leaves_management.status', $status);
            }
            
            $leaves = $query->select(
                    'leaves_management.id',
                    'leaves_management.leaves_start_date as startDate',
                    'leaves_management.leaves_end_date as endDate',
                    'leaves_management.leaves_days as days',
                    'leaves_management.reason',
                    'leaves_management.status',
                    'leaves_management.comments',
                    'leaves_management.created_at as requestedAt',
                    'leaves_management.leave_type_id',
                    'leave_types.name as leave_type_name',
                    'users.id as userId',
                    'users.first_name',
                    'users.last_name',
                    'users.role_as',
                    'branches.branch_name as branch'
                )
                ->orderBy('leaves_management.created_at', 'desc')
                ->paginate(20);
            
            $roles = [
                1 => 'Super Admin', 2 => 'Branch Admin', 3 => 'Doctor',
                4 => 'Pharmacist', 5 => 'Nurse', 7 => 'Cashier',
                9 => 'IT Support', 10 => 'Center Aid', 11 => 'Auditor'
            ];
            
            $formattedLeaves = collect($leaves->items())->map(function($leave) use ($roles) {
                return [
                    'id' => $leave->id,
                    'employee' => $leave->first_name . ' ' . $leave->last_name,
                    'employeeId' => 'EMP-' . str_pad($leave->userId, 4, '0', STR_PAD_LEFT),
                    'role' => $roles[$leave->role_as] ?? 'Staff',
                    'branch' => $leave->branch ?? 'N/A',
                    'startDate' => $leave->startDate,
                    'endDate' => $leave->endDate,
                    'days' => $leave->days,
                    'reason' => $leave->reason,
                    'status' => $leave->status,
                    'comments' => $leave->comments,
                    'requestedAt' => $leave->requestedAt,
                    'leaveType' => $leave->leave_type_name ?? 'General Leave'
                ];
            });
            
            return response()->json([
                'status' => 200,
                'leaves' => $formattedLeaves,
                'pagination' => [
                    'total' => $leaves->total(),
                    'perPage' => $leaves->perPage(),
                    'currentPage' => $leaves->currentPage(),
                    'lastPage' => $leaves->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch pending leaves',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve/Reject leave request (Branch Admin)
     * PUT /api/hrm/branch-admin/leave/{id}/approve
     */
    public function approveLeave(Request $request, $id)
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
                'action' => 'required|in:approve,reject',
                'comments' => 'nullable|string|max:500'
            ]);
            
            $leave = DB::table('leaves_management')
                ->join('users', 'leaves_management.user_id', '=', 'users.id')
                ->where('leaves_management.id', $id)
                ->select('leaves_management.*', 'users.branch_id')
                ->first();
            
            if (!$leave) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Leave request not found'
                ], 404);
            }
            
            // Branch Admin can only approve their branch staff
            if ($this->isBranchAdmin($user) && $leave->branch_id !== $user->branch_id) {
                return response()->json([
                    'status' => 403,
                    'message' => 'You can only manage leave requests for your branch'
                ], 403);
            }
            
            if ($leave->status !== 'Pending') {
                return response()->json([
                    'status' => 400,
                    'message' => 'This leave request has already been processed'
                ], 400);
            }
            
            $newStatus = $validated['action'] === 'approve' ? 'Approved' : 'Rejected';
            
            DB::table('leaves_management')
                ->where('id', $id)
                ->update([
                    'status' => $newStatus,
                    'assigner' => $user->id,
                    'approval_date' => now(),
                    'comments' => $validated['comments'] ?? null,
                    'updated_at' => now()
                ]);
            
            // Also update admin_leave_management if exists
            DB::table('admin_leave_management')->updateOrInsert(
                ['leave_id' => $id],
                [
                    'id' => Str::uuid()->toString(),
                    'status' => $newStatus,
                    'comments' => $validated['comments'] ?? null,
                    'admin_access' => 1,
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
            
            return response()->json([
                'status' => 200,
                'message' => "Leave request {$newStatus} successfully"
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to process leave request',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
