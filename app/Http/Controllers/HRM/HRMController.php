<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\AllUsers\User;
use App\Models\Branch;
use App\Models\StaffSalary\StaffSalary;
use App\Models\StaffSalary\EmployeeBankDetails;
use App\Models\LeavesManagement\LeavesManagement;
use App\Models\EmployeeOT\EmployeeOT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class HRMController extends Controller
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
    
    /**
     * Check if user has Super Admin access (role_as = 1)
     */
    protected function isSuperAdmin($user): bool
    {
        return $user && $user->role_as === 1;
    }
    
    /**
     * Check if user has Branch Admin access (role_as = 2)
     */
    protected function isBranchAdmin($user): bool
    {
        return $user && $user->role_as === 2;
    }
    
    /**
     * Check if user has HR access (Super Admin or Branch Admin)
     */
    protected function hasHRAccess($user): bool
    {
        return $this->isSuperAdmin($user) || $this->isBranchAdmin($user);
    }

    /**
     * Super Admin HRM Dashboard Stats
     * GET /api/hrm/super-admin/stats
     */
    public function getSuperAdminStats(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. Super Admin access required.'
            ], 403);
        }
        
        try {
            // Total staff count (excluding patients - role_as = 6)
            $totalStaff = User::where('is_active', 1)
                ->where('role_as', '!=', 6) // Exclude patients
                ->count();
            
            // Active staff this month
            $activeStaff = User::where('is_active', 1)
                ->where('role_as', '!=', 6)
                ->count();
            
            // Total payroll (sum of all basic salaries)
            $totalPayroll = StaffSalary::sum('basic_salary_amount');
            
            // Pending leave requests
            $pendingLeaves = DB::table('leaves_management')
                ->where('status', 'Pending')
                ->count();
            
            // Total overtime this month
            $currentMonth = now()->format('Y-m');
            $totalOvertimeHours = DB::table('employee_ot')
                ->whereRaw("strftime('%Y-%m', date) = ?", [$currentMonth])
                ->sum('hours_worked');
            $totalOvertimeAmount = DB::table('employee_ot')
                ->whereRaw("strftime('%Y-%m', date) = ?", [$currentMonth])
                ->sum('total_ot_amount');
            
            // EPF/ETF calculations (Sri Lanka rates)
            $epfEmployeeRate = 0.08; // 8%
            $epfEmployerRate = 0.12; // 12%
            $etfEmployerRate = 0.03; // 3%
            
            $epfEmployee = $totalPayroll * $epfEmployeeRate;
            $epfEmployer = $totalPayroll * $epfEmployerRate;
            $etfEmployer = $totalPayroll * $etfEmployerRate;
            
            // Branch overview
            $branchStats = Branch::leftJoin('users', function($join) {
                    $join->on('branches.id', '=', 'users.branch_id')
                        ->where('users.is_active', 1)
                        ->where('users.role_as', '!=', 6);
                })
                ->select(
                    'branches.id',
                    'branches.center_name as branch_name',
                    DB::raw('COUNT(users.id) as staff_count')
                )
                ->groupBy('branches.id', 'branches.center_name')
                ->get();
            
            return response()->json([
                'status' => 200,
                'stats' => [
                    'totalStaff' => $totalStaff,
                    'activeStaff' => $activeStaff,
                    'totalPayroll' => round($totalPayroll, 2),
                    'pendingLeaves' => $pendingLeaves,
                    'overtime' => [
                        'hours' => round($totalOvertimeHours, 2),
                        'amount' => round($totalOvertimeAmount, 2)
                    ],
                    'epfEtf' => [
                        'epfEmployee' => round($epfEmployee, 2),
                        'epfEmployer' => round($epfEmployer, 2),
                        'etfEmployer' => round($etfEmployer, 2),
                        'totalContributions' => round($epfEmployee + $epfEmployer + $etfEmployer, 2)
                    ],
                    'branchOverview' => $branchStats
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch HRM stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Branch Admin HRM Dashboard Stats
     * GET /api/hrm/branch-admin/stats
     */
    public function getBranchAdminStats(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isBranchAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. Branch Admin access required.'
            ], 403);
        }
        
        $branchId = $user->branch_id;
        
        try {
            // Staff count for this branch
            $staffCount = User::where('branch_id', $branchId)
                ->where('is_active', 1)
                ->where('role_as', '!=', 6)
                ->count();
            
            // Staff on leave today
            $today = now()->format('Y-m-d');
            $staffOnLeave = DB::table('leaves_management')
                ->join('users', 'leaves_management.user_id', '=', 'users.id')
                ->where('users.branch_id', $branchId)
                ->where('leaves_management.status', 'Approved')
                ->where('leaves_management.leaves_start_date', '<=', $today)
                ->where('leaves_management.leaves_end_date', '>=', $today)
                ->count();
            
            // Pending leave requests for this branch
            $pendingLeaves = DB::table('leaves_management')
                ->join('users', 'leaves_management.user_id', '=', 'users.id')
                ->where('users.branch_id', $branchId)
                ->where('leaves_management.status', 'Pending')
                ->count();
            
            // This month's payroll for branch
            $branchPayroll = StaffSalary::where('branch_id', $branchId)
                ->sum('basic_salary_amount');
            
            // Pending OT approvals
            $pendingOT = DB::table('employee_ot')
                ->join('users', 'employee_ot.employee_id', '=', 'users.id')
                ->where('users.branch_id', $branchId)
                ->count();
            
            // EPF/ETF for branch
            $epfEmployee = $branchPayroll * 0.08;
            $epfEmployer = $branchPayroll * 0.12;
            $etfEmployer = $branchPayroll * 0.03;
            
            // Staff by role breakdown
            $staffByRole = User::where('branch_id', $branchId)
                ->where('is_active', 1)
                ->where('role_as', '!=', 6)
                ->select('role_as', DB::raw('COUNT(*) as count'))
                ->groupBy('role_as')
                ->get()
                ->map(function($item) {
                    $roles = [
                        1 => 'Super Admin',
                        2 => 'Branch Admin',
                        3 => 'Doctor',
                        4 => 'Pharmacist',
                        5 => 'Nurse',
                        7 => 'Cashier',
                        8 => 'Supplier',
                        9 => 'IT Support',
                        10 => 'Center Aid',
                        11 => 'Auditor'
                    ];
                    return [
                        'role' => $roles[$item->role_as] ?? 'Unknown',
                        'count' => $item->count
                    ];
                });
            
            // Pending leave requests list
            $pendingLeavesList = DB::table('leaves_management')
                ->join('users', 'leaves_management.user_id', '=', 'users.id')
                ->where('users.branch_id', $branchId)
                ->where('leaves_management.status', 'Pending')
                ->select(
                    'leaves_management.id',
                    'leaves_management.leaves_start_date',
                    'leaves_management.leaves_end_date',
                    'leaves_management.leaves_days',
                    'leaves_management.reason',
                    'leaves_management.created_at',
                    'users.first_name',
                    'users.last_name',
                    'users.role_as'
                )
                ->orderBy('leaves_management.created_at', 'desc')
                ->limit(5)
                ->get();
            
            return response()->json([
                'status' => 200,
                'stats' => [
                    'staffCount' => $staffCount,
                    'staffOnLeave' => $staffOnLeave,
                    'pendingLeaves' => $pendingLeaves,
                    'branchPayroll' => round($branchPayroll, 2),
                    'pendingOT' => $pendingOT,
                    'epfEtf' => [
                        'epfEmployee' => round($epfEmployee, 2),
                        'epfEmployer' => round($epfEmployer, 2),
                        'etfEmployer' => round($etfEmployer, 2)
                    ],
                    'staffByRole' => $staffByRole,
                    'pendingLeavesList' => $pendingLeavesList
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch HRM stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Employee Self-Service HRM Dashboard Stats
     * GET /api/hrm/employee/stats
     */
    public function getEmployeeStats(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $userId = $user->id;
            
            // Get salary info
            $salary = StaffSalary::where('user_id', $userId)->first();
            
            // Get bank details
            $bankDetails = EmployeeBankDetails::where('user_id', $userId)->first();
            
            // Leave balance (assuming 14 annual leave days per year)
            $annualLeaveQuota = 14;
            $currentYear = now()->format('Y');
            $usedLeaves = DB::table('leaves_management')
                ->where('user_id', $userId)
                ->where('status', 'Approved')
                ->whereRaw("strftime('%Y', leaves_start_date) = ?", [$currentYear])
                ->sum('leaves_days');
            $remainingLeaves = max(0, $annualLeaveQuota - $usedLeaves);
            
            // Pending leave requests
            $pendingLeaves = DB::table('leaves_management')
                ->where('user_id', $userId)
                ->where('status', 'Pending')
                ->count();
            
            // This month's overtime
            $currentMonth = now()->format('Y-m');
            $monthlyOT = DB::table('employee_ot')
                ->where('employee_id', $userId)
                ->whereRaw("strftime('%Y-%m', date) = ?", [$currentMonth])
                ->selectRaw('SUM(hours_worked) as hours, SUM(total_ot_amount) as amount')
                ->first();
            
            // Recent leave history
            $leaveHistory = DB::table('leaves_management')
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();
            
            // EPF/ETF calculations based on basic salary
            $basicSalary = $salary ? $salary->basic_salary_amount : ($user->basic_salary ?? 0);
            $epfEmployee = $basicSalary * 0.08;
            $epfEmployer = $basicSalary * 0.12;
            $etfEmployer = $basicSalary * 0.03;
            $netSalary = $basicSalary - $epfEmployee;
            
            return response()->json([
                'status' => 200,
                'stats' => [
                    'profile' => [
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'joiningDate' => $user->joining_date,
                        'employeeId' => 'EMP-' . substr($user->id, 0, 8)
                    ],
                    'salary' => [
                        'basic' => round($basicSalary, 2),
                        'allowances' => $salary ? round($salary->allocation_amount ?? 0, 2) : 0,
                        'epfEmployee' => round($epfEmployee, 2),
                        'epfEmployer' => round($epfEmployer, 2),
                        'etfEmployer' => round($etfEmployer, 2),
                        'netSalary' => round($netSalary, 2)
                    ],
                    'leave' => [
                        'annual' => $annualLeaveQuota,
                        'used' => (int)$usedLeaves,
                        'remaining' => $remainingLeaves,
                        'pending' => $pendingLeaves
                    ],
                    'overtime' => [
                        'hoursThisMonth' => round($monthlyOT->hours ?? 0, 2),
                        'amountThisMonth' => round($monthlyOT->amount ?? 0, 2)
                    ],
                    'leaveHistory' => $leaveHistory,
                    'hasBankDetails' => $bankDetails ? true : false
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch employee stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get employee HR profile
     * GET /api/hrm/employee/profile
     */
    public function getEmployeeProfile(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            $salary = StaffSalary::where('user_id', $user->id)->first();
            $bankDetails = EmployeeBankDetails::where('user_id', $user->id)->first();
            $branch = Branch::find($user->branch_id);
            
            $roles = [
                1 => 'Super Admin',
                2 => 'Branch Admin', 
                3 => 'Doctor',
                4 => 'Pharmacist',
                5 => 'Nurse',
                6 => 'Patient/Receptionist',
                7 => 'Cashier',
                8 => 'Supplier',
                9 => 'IT Support',
                10 => 'Center Aid',
                11 => 'Auditor'
            ];
            
            return response()->json([
                'status' => 200,
                'profile' => [
                    'personal' => [
                        'firstName' => $user->first_name,
                        'lastName' => $user->last_name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'nic' => $user->nic,
                        'dateOfBirth' => $user->date_of_birth,
                        'gender' => $user->gender,
                        'address' => $user->address,
                        'profilePicture' => $user->profile_picture
                    ],
                    'employment' => [
                        'employeeId' => 'EMP-' . substr($user->id, 0, 8),
                        'role' => $roles[$user->role_as] ?? 'Unknown',
                        'userType' => $user->user_type,
                        'branch' => $branch ? $branch->branch_name : 'N/A',
                        'branchId' => $user->branch_id,
                        'joiningDate' => $user->joining_date,
                        'status' => $user->is_active ? 'Active' : 'Inactive'
                    ],
                    'salary' => [
                        'basicSalary' => $salary ? $salary->basic_salary_amount : ($user->basic_salary ?? 0),
                        'allowances' => $salary ? $salary->allocation_amount : 0,
                        'hourlyRate' => $salary ? $salary->rate_for_hour : 0,
                        'maxHours' => $salary ? $salary->maximum_hours_can_work : 0,
                        'epfApplicable' => true
                    ],
                    'bank' => $bankDetails ? [
                        'bankName' => $bankDetails->bank_name,
                        'branchName' => $bankDetails->branch_name,
                        'branchCode' => $bankDetails->branch_code,
                        'accountNumber' => $bankDetails->account_number,
                        'accountOwnerName' => $bankDetails->account_owner_name
                    ] : null
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get branch staff list for HRM
     * GET /api/hrm/branch-admin/staff
     */
    public function getBranchStaff(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $query = User::where('is_active', 1)
                ->where('role_as', '!=', 6); // Exclude patients
            
            // Branch Admin can only see their branch staff
            if ($this->isBranchAdmin($user)) {
                $query->where('branch_id', $user->branch_id);
            } elseif ($request->has('branch_id') && $request->branch_id !== 'all') {
                // Super Admin can filter by branch
                $query->where('branch_id', $request->branch_id);
            }
            
            // Filter by role
            if ($request->has('role') && $request->role !== 'all' && !empty($request->role)) {
                $query->where('role_as', $request->role);
            }
            
            // Filter by employment type
            if ($request->has('employment_type') && !empty($request->employment_type)) {
                $query->where('employment_type', $request->employment_type);
            }
            
            // Filter by status
            if ($request->has('status') && !empty($request->status)) {
                if ($request->status === 'active') {
                    $query->where('is_active', 1)->where('employment_status', '!=', 'on_leave');
                } elseif ($request->status === 'on_leave') {
                    $query->where('employment_status', 'on_leave');
                } elseif ($request->status === 'inactive') {
                    $query->where('is_active', 0);
                }
            }
            
            // Search
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('employee_id', 'like', "%{$search}%")
                      ->orWhere('department', 'like', "%{$search}%");
                });
            }
            
            // Clone query for stats before pagination
            $statsQuery = clone $query;
            
            $staff = $query->with(['branch'])
                ->orderBy('first_name')
                ->paginate($request->get('per_page', 20));
            
            $roles = [
                1 => 'Super Admin',
                2 => 'Branch Admin',
                3 => 'Doctor',
                4 => 'Pharmacist',
                5 => 'Nurse',
                7 => 'Cashier',
                8 => 'Supplier',
                9 => 'IT Support',
                10 => 'Center Aid',
                11 => 'Auditor'
            ];
            
            $staffList = $staff->map(function($s) use ($roles) {
                $status = 'Active';
                if (!$s->is_active) {
                    $status = 'Inactive';
                } elseif ($s->employment_status === 'on_leave') {
                    $status = 'On Leave';
                } elseif ($s->employment_status === 'suspended') {
                    $status = 'Suspended';
                }
                
                return [
                    'id' => $s->id,
                    'name' => trim($s->first_name . ' ' . $s->last_name),
                    'first_name' => $s->first_name,
                    'last_name' => $s->last_name,
                    'email' => $s->email,
                    'phone' => $s->phone,
                    'nic' => $s->nic,
                    'date_of_birth' => $s->date_of_birth,
                    'gender' => $s->gender,
                    'address' => $s->address,
                    'role' => $roles[$s->role_as] ?? 'Unknown',
                    'roleId' => $s->role_as,
                    'branch' => $s->branch ? $s->branch->branch_name : 'N/A',
                    'department' => $s->department,
                    'designation' => $s->designation,
                    'employee_id' => $s->employee_id,
                    'joiningDate' => $s->joining_date,
                    'basic_salary' => $s->basic_salary ?? 0,
                    'employment_type' => $s->employment_type ?? 'full_time',
                    'employment_status' => $s->employment_status ?? 'active',
                    'epf_number' => $s->epf_number,
                    'epf_applicable' => $s->epf_applicable ?? true,
                    'weekly_hours' => $s->weekly_hours ?? 40,
                    'shift_eligible' => $s->shift_eligible ?? true,
                    'contract_end_date' => $s->contract_end_date,
                    'confirmation_date' => $s->confirmation_date,
                    'emergency_contact_name' => $s->emergency_contact_name,
                    'emergency_contact_phone' => $s->emergency_contact_phone,
                    'emergency_contact_relationship' => $s->emergency_contact_relationship,
                    'qualifications' => $s->qualifications,
                    'certifications' => $s->certifications,
                    'status' => $status
                ];
            });
            
            // Calculate stats
            $allStaff = $statsQuery->get();
            $stats = [
                'total' => $allStaff->count(),
                'active' => $allStaff->where('is_active', 1)->where('employment_status', '!=', 'on_leave')->count(),
                'onLeave' => $allStaff->where('employment_status', 'on_leave')->count(),
                'byRole' => $allStaff->groupBy('role_as')->map->count()->toArray(),
                'byDepartment' => $allStaff->groupBy('department')->map->count()->toArray()
            ];
            
            return response()->json([
                'status' => 200,
                'staff' => $staffList,
                'stats' => $stats,
                'pagination' => [
                    'total' => $staff->total(),
                    'perPage' => $staff->perPage(),
                    'currentPage' => $staff->currentPage(),
                    'lastPage' => $staff->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch staff',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get single staff HR profile
     * GET /api/hrm/branch-admin/staff/{id}
     */
    public function getStaffProfile(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $staffQuery = User::where('id', $id);
            
            // Branch Admin can only see their branch staff
            if ($this->isBranchAdmin($user)) {
                $staffQuery->where('branch_id', $user->branch_id);
            }
            
            $staff = $staffQuery->with('branch')->first();
            
            if (!$staff) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Staff member not found'
                ], 404);
            }
            
            $roles = [
                1 => 'Super Admin',
                2 => 'Branch Admin',
                3 => 'Doctor',
                4 => 'Pharmacist',
                5 => 'Nurse',
                7 => 'Cashier',
                8 => 'Supplier',
                9 => 'IT Support',
                10 => 'Center Aid',
                11 => 'Auditor'
            ];
            
            $status = 'Active';
            if (!$staff->is_active) {
                $status = 'Inactive';
            } elseif ($staff->employment_status === 'on_leave') {
                $status = 'On Leave';
            } elseif ($staff->employment_status === 'suspended') {
                $status = 'Suspended';
            }
            
            return response()->json([
                'status' => 200,
                'staff' => [
                    'id' => $staff->id,
                    'name' => trim($staff->first_name . ' ' . $staff->last_name),
                    'first_name' => $staff->first_name,
                    'last_name' => $staff->last_name,
                    'email' => $staff->email,
                    'phone' => $staff->phone,
                    'nic' => $staff->nic,
                    'date_of_birth' => $staff->date_of_birth,
                    'gender' => $staff->gender,
                    'address' => $staff->address,
                    'role' => $roles[$staff->role_as] ?? 'Unknown',
                    'roleId' => $staff->role_as,
                    'branch' => $staff->branch ? $staff->branch->branch_name : 'N/A',
                    'department' => $staff->department,
                    'designation' => $staff->designation,
                    'employee_id' => $staff->employee_id,
                    'joiningDate' => $staff->joining_date,
                    'basic_salary' => $staff->basic_salary ?? 0,
                    'employment_type' => $staff->employment_type ?? 'full_time',
                    'employment_status' => $staff->employment_status ?? 'active',
                    'epf_number' => $staff->epf_number,
                    'epf_applicable' => $staff->epf_applicable ?? true,
                    'weekly_hours' => $staff->weekly_hours ?? 40,
                    'shift_eligible' => $staff->shift_eligible ?? true,
                    'contract_end_date' => $staff->contract_end_date,
                    'confirmation_date' => $staff->confirmation_date,
                    'emergency_contact_name' => $staff->emergency_contact_name,
                    'emergency_contact_phone' => $staff->emergency_contact_phone,
                    'emergency_contact_relationship' => $staff->emergency_contact_relationship,
                    'qualifications' => $staff->qualifications,
                    'certifications' => $staff->certifications,
                    'status' => $status
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch staff profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update staff HR profile
     * PUT /api/hrm/branch-admin/staff/{id}
     */
    public function updateStaffProfile(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $staffQuery = User::where('id', $id);
            
            // Branch Admin can only update their branch staff
            if ($this->isBranchAdmin($user)) {
                $staffQuery->where('branch_id', $user->branch_id);
            }
            
            $staff = $staffQuery->first();
            
            if (!$staff) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Staff member not found'
                ], 404);
            }
            
            // Update HR fields
            $updateData = [];
            $hrFields = [
                'department', 'designation', 'basic_salary', 'employment_type', 'employment_status',
                'epf_number', 'epf_applicable', 'weekly_hours', 'shift_eligible',
                'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
                'qualifications', 'certifications'
            ];
            
            foreach ($hrFields as $field) {
                if ($request->has($field)) {
                    $updateData[$field] = $request->input($field);
                }
            }
            
            if (!empty($updateData)) {
                $staff->update($updateData);
                
                // Log the update to HR audit log if table exists
                try {
                    \DB::table('hrm_audit_logs')->insert([
                        'user_id' => $user->id,
                        'action' => 'update_staff_profile',
                        'entity_type' => 'user',
                        'entity_id' => $staff->id,
                        'old_values' => json_encode($staff->getOriginal()),
                        'new_values' => json_encode($updateData),
                        'description' => "Updated HR profile for {$staff->first_name} {$staff->last_name}",
                        'branch_id' => $user->branch_id,
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                } catch (\Exception $e) {
                    // Silently fail audit log if table doesn't exist
                }
            }
            
            return response()->json([
                'status' => 200,
                'message' => 'Staff profile updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update staff profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export staff HR data to CSV
     * GET /api/hrm/branch-admin/staff/export
     */
    public function exportStaffData(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->hasHRAccess($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. HR access required.'
            ], 403);
        }
        
        try {
            $query = User::where('is_active', 1)
                ->where('role_as', '!=', 6);
            
            if ($this->isBranchAdmin($user)) {
                $query->where('branch_id', $user->branch_id);
            }
            
            $staff = $query->with('branch')->orderBy('first_name')->get();
            
            $roles = [
                1 => 'Super Admin',
                2 => 'Branch Admin',
                3 => 'Doctor',
                4 => 'Pharmacist',
                5 => 'Nurse',
                7 => 'Cashier',
                8 => 'Supplier',
                9 => 'IT Support',
                10 => 'Center Aid',
                11 => 'Auditor'
            ];
            
            $csvData = "Employee ID,Name,Email,Phone,Role,Department,Designation,Employment Type,Join Date,Basic Salary,EPF Number,Status\n";
            
            foreach ($staff as $s) {
                $status = $s->is_active ? 'Active' : 'Inactive';
                if ($s->employment_status === 'on_leave') $status = 'On Leave';
                
                $csvData .= implode(',', [
                    '"' . ($s->employee_id ?? '') . '"',
                    '"' . $s->first_name . ' ' . $s->last_name . '"',
                    '"' . $s->email . '"',
                    '"' . ($s->phone ?? '') . '"',
                    '"' . ($roles[$s->role_as] ?? 'Unknown') . '"',
                    '"' . ($s->department ?? '') . '"',
                    '"' . ($s->designation ?? '') . '"',
                    '"' . ($s->employment_type ?? 'full_time') . '"',
                    '"' . ($s->joining_date ?? '') . '"',
                    $s->basic_salary ?? 0,
                    '"' . ($s->epf_number ?? '') . '"',
                    '"' . $status . '"'
                ]) . "\n";
            }
            
            return response($csvData, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="staff_hr_profiles.csv"'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to export staff data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
