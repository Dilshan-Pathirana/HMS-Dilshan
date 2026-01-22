<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\AllUsers\User;
use App\Models\StaffSalary\StaffSalary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HRMOvertimeController extends Controller
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
     * Get employee overtime summary
     * GET /api/hrm/employee/overtime
     */
    public function getEmployeeOvertime(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $currentMonth = now()->format('Y-m');
            $lastMonth = now()->subMonth()->format('Y-m');
            $currentYear = now()->format('Y');
            
            // This month OT
            $thisMonthOT = DB::table('employee_ot')
                ->where('employee_id', $user->id)
                ->whereRaw("strftime('%Y-%m', date) = ?", [$currentMonth])
                ->selectRaw('SUM(hours_worked) as hours, SUM(total_ot_amount) as amount')
                ->first();
            
            // Last month OT
            $lastMonthOT = DB::table('employee_ot')
                ->where('employee_id', $user->id)
                ->whereRaw("strftime('%Y-%m', date) = ?", [$lastMonth])
                ->selectRaw('SUM(hours_worked) as hours, SUM(total_ot_amount) as amount')
                ->first();
            
            // Year to date
            $ytdOT = DB::table('employee_ot')
                ->where('employee_id', $user->id)
                ->whereRaw("strftime('%Y', date) = ?", [$currentYear])
                ->selectRaw('SUM(hours_worked) as hours, SUM(total_ot_amount) as amount')
                ->first();
            
            // Get hourly rate from staff salary
            $salary = StaffSalary::where('user_id', $user->id)->first();
            $hourlyRate = $salary ? $salary->rate_for_hour : 0;
            $otRate = $hourlyRate * 1.5; // 150% overtime rate
            
            // OT History
            $history = DB::table('employee_ot')
                ->where('employee_id', $user->id)
                ->orderBy('date', 'desc')
                ->limit(10)
                ->get();
            
            return response()->json([
                'status' => 200,
                'overtime' => [
                    'thisMonth' => [
                        'hours' => round($thisMonthOT->hours ?? 0, 2),
                        'amount' => round($thisMonthOT->amount ?? 0, 2)
                    ],
                    'lastMonth' => [
                        'hours' => round($lastMonthOT->hours ?? 0, 2),
                        'amount' => round($lastMonthOT->amount ?? 0, 2)
                    ],
                    'yearToDate' => [
                        'hours' => round($ytdOT->hours ?? 0, 2),
                        'amount' => round($ytdOT->amount ?? 0, 2)
                    ],
                    'hourlyRate' => round($hourlyRate, 2),
                    'otRate' => round($otRate, 2),
                    'history' => $history
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch overtime data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get branch overtime summary (Branch Admin)
     * GET /api/hrm/branch-admin/overtime
     */
    public function getBranchOvertime(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $currentMonth = now()->format('Y-m');
            $branchId = $this->isBranchAdmin($user) ? $user->branch_id : $request->input('branch_id');
            
            // Filter by month
            $month = $request->input('month', $currentMonth);
            
            // Get all overtime records
            $recordsQuery = DB::table('employee_ot')
                ->join('users', 'employee_ot.employee_id', '=', 'users.id')
                ->leftJoin('branches', 'users.branch_id', '=', 'branches.id')
                ->whereRaw("strftime('%Y-%m', employee_ot.date) = ?", [$month]);
            
            if ($branchId) {
                $recordsQuery->where('users.branch_id', $branchId);
            }
            
            $records = $recordsQuery
                ->select(
                    'employee_ot.id',
                    'employee_ot.date',
                    'employee_ot.hours_worked',
                    'employee_ot.ot_rate',
                    'employee_ot.total_ot_amount',
                    'employee_ot.created_at',
                    'users.id as userId',
                    'users.first_name',
                    'users.last_name',
                    'users.role_as',
                    'branches.center_name as branch'
                )
                ->orderBy('employee_ot.date', 'desc')
                ->get();
            
            // Get summary by employee
            $summaryQuery = DB::table('employee_ot')
                ->join('users', 'employee_ot.employee_id', '=', 'users.id')
                ->leftJoin('branches', 'users.branch_id', '=', 'branches.id')
                ->whereRaw("strftime('%Y-%m', employee_ot.date) = ?", [$month]);
            
            if ($branchId) {
                $summaryQuery->where('users.branch_id', $branchId);
            }
            
            $overtimeByEmployee = $summaryQuery
                ->select(
                    'users.id as userId',
                    'users.first_name',
                    'users.last_name',
                    'users.role_as',
                    'branches.center_name as branch',
                    DB::raw('SUM(employee_ot.hours_worked) as totalHours'),
                    DB::raw('SUM(employee_ot.total_ot_amount) as totalAmount')
                )
                ->groupBy('users.id', 'users.first_name', 'users.last_name', 'users.role_as', 'branches.center_name')
                ->orderByDesc('totalHours')
                ->get();
            
            // Total OT for branch
            $totalQuery = DB::table('employee_ot')
                ->join('users', 'employee_ot.employee_id', '=', 'users.id')
                ->whereRaw("strftime('%Y-%m', employee_ot.date) = ?", [$month]);
            
            if ($branchId) {
                $totalQuery->where('users.branch_id', $branchId);
            }
            
            $totalOT = $totalQuery
                ->selectRaw('SUM(employee_ot.hours_worked) as hours, SUM(employee_ot.total_ot_amount) as amount')
                ->first();
            
            $roles = [
                1 => 'Super Admin', 2 => 'Branch Admin', 3 => 'Doctor',
                4 => 'Pharmacist', 5 => 'Nurse', 7 => 'Cashier',
                9 => 'IT Support', 10 => 'Center Aid', 11 => 'Auditor'
            ];
            
            $formattedRecords = $records->map(function($item) use ($roles) {
                return [
                    'id' => $item->id,
                    'employeeId' => $item->userId,
                    'employeeName' => $item->first_name . ' ' . $item->last_name,
                    'role' => $roles[$item->role_as] ?? 'Staff',
                    'branch' => $item->branch ?? 'N/A',
                    'date' => $item->date,
                    'hoursWorked' => round($item->hours_worked, 2),
                    'otRate' => round($item->ot_rate, 2),
                    'totalAmount' => round($item->total_ot_amount, 2),
                    'createdAt' => $item->created_at
                ];
            });
            
            $formattedSummary = $overtimeByEmployee->map(function($item) use ($roles) {
                return [
                    'userId' => $item->userId,
                    'name' => $item->first_name . ' ' . $item->last_name,
                    'role' => $roles[$item->role_as] ?? 'Staff',
                    'branch' => $item->branch ?? 'N/A',
                    'totalHours' => round($item->totalHours, 2),
                    'totalAmount' => round($item->totalAmount, 2)
                ];
            });
            
            return response()->json([
                'status' => 200,
                'overtime' => [
                    'month' => $month,
                    'summary' => [
                        'totalHours' => round($totalOT->hours ?? 0, 2),
                        'totalAmount' => round($totalOT->amount ?? 0, 2),
                        'employeeCount' => $overtimeByEmployee->count(),
                        'recordCount' => $records->count()
                    ],
                    'byEmployee' => $formattedSummary,
                    'records' => $formattedRecords
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch overtime data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Record overtime entry (Branch Admin)
     * POST /api/hrm/branch-admin/overtime
     */
    public function recordOvertime(Request $request)
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
                'employee_id' => 'required|uuid|exists:users,id',
                'date' => 'required|date|before_or_equal:today',
                'hours_worked' => 'required|numeric|min:0.5|max:12',
                'reason' => 'nullable|string|max:500'
            ]);
            
            // Get employee's salary info to calculate OT rate
            $employee = User::find($validated['employee_id']);
            
            if (!$employee) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Employee not found'
                ], 404);
            }
            
            // Branch Admin can only add OT for their branch staff
            if ($this->isBranchAdmin($user) && $employee->branch_id !== $user->branch_id) {
                return response()->json([
                    'status' => 403,
                    'message' => 'You can only record overtime for your branch staff'
                ], 403);
            }
            
            $salary = StaffSalary::where('user_id', $validated['employee_id'])->first();
            $hourlyRate = $salary ? $salary->rate_for_hour : 0;
            $otRate = $hourlyRate * 1.5; // 150% rate
            $totalAmount = $otRate * $validated['hours_worked'];
            
            // Check for existing entry on same date
            $existing = DB::table('employee_ot')
                ->where('employee_id', $validated['employee_id'])
                ->where('date', $validated['date'])
                ->first();
            
            if ($existing) {
                // Update existing entry
                DB::table('employee_ot')
                    ->where('id', $existing->id)
                    ->update([
                        'hours_worked' => $validated['hours_worked'],
                        'ot_rate' => $otRate,
                        'total_ot_amount' => $totalAmount,
                        'updated_at' => now()
                    ]);
                
                $otId = $existing->id;
            } else {
                // Create new entry
                $otId = Str::uuid()->toString();
                DB::table('employee_ot')->insert([
                    'id' => $otId,
                    'employee_id' => $validated['employee_id'],
                    'date' => $validated['date'],
                    'hours_worked' => $validated['hours_worked'],
                    'ot_rate' => $otRate,
                    'total_ot_amount' => $totalAmount,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            
            return response()->json([
                'status' => 201,
                'message' => 'Overtime recorded successfully',
                'overtime' => [
                    'id' => $otId,
                    'employeeId' => $validated['employee_id'],
                    'date' => $validated['date'],
                    'hoursWorked' => $validated['hours_worked'],
                    'otRate' => $otRate,
                    'totalAmount' => $totalAmount
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
                'message' => 'Failed to record overtime',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete overtime entry (Branch Admin)
     * DELETE /api/hrm/branch-admin/overtime/{id}
     */
    public function deleteOvertime(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $ot = DB::table('employee_ot')
                ->join('users', 'employee_ot.employee_id', '=', 'users.id')
                ->where('employee_ot.id', $id)
                ->select('employee_ot.*', 'users.branch_id')
                ->first();
            
            if (!$ot) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Overtime entry not found'
                ], 404);
            }
            
            // Branch Admin can only delete their branch OT entries
            if ($this->isBranchAdmin($user) && $ot->branch_id !== $user->branch_id) {
                return response()->json([
                    'status' => 403,
                    'message' => 'You can only delete overtime entries for your branch staff'
                ], 403);
            }
            
            DB::table('employee_ot')->where('id', $id)->delete();
            
            return response()->json([
                'status' => 200,
                'message' => 'Overtime entry deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete overtime entry',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
