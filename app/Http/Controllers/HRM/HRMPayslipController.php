<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\AllUsers\User;
use App\Models\StaffSalary\StaffSalary;
use App\Models\StaffSalary\EmployeeBankDetails;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HRMPayslipController extends Controller
{
    /**
     * Sri Lanka EPF/ETF Rates
     */
    const EPF_EMPLOYEE_RATE = 0.08; // 8%
    const EPF_EMPLOYER_RATE = 0.12; // 12%
    const ETF_EMPLOYER_RATE = 0.03; // 3%
    
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
     * Get employee payslips list
     * GET /api/hrm/employee/payslips
     */
    public function getEmployeePayslips(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            // Get payslips from staff_salary_pay table
            $payslips = DB::table('staff_salary_pay')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(12);
            
            // If no payslips exist, generate sample data based on current salary
            if ($payslips->isEmpty()) {
                $salary = StaffSalary::where('user_id', $user->id)->first();
                $basicSalary = $salary ? $salary->basic_salary_amount : ($user->basic_salary ?? 0);
                
                // Generate last 3 months sample payslips
                $samplePayslips = [];
                for ($i = 0; $i < 3; $i++) {
                    $month = now()->subMonths($i);
                    $samplePayslips[] = $this->generatePayslipData($user, $basicSalary, $month->format('Y-m'));
                }
                
                return response()->json([
                    'status' => 200,
                    'payslips' => $samplePayslips,
                    'sample' => true,
                    'pagination' => [
                        'total' => count($samplePayslips),
                        'perPage' => 12,
                        'currentPage' => 1,
                        'lastPage' => 1
                    ]
                ]);
            }
            
            return response()->json([
                'status' => 200,
                'payslips' => $payslips->items(),
                'pagination' => [
                    'total' => $payslips->total(),
                    'perPage' => $payslips->perPage(),
                    'currentPage' => $payslips->currentPage(),
                    'lastPage' => $payslips->lastPage()
                ]
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
     * Get single payslip details
     * GET /api/hrm/employee/payslips/{id}
     */
    public function getPayslipDetails(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        try {
            // If ID is a year-month format (e.g., 2025-01), generate payslip
            if (preg_match('/^\d{4}-\d{2}$/', $id)) {
                $salary = StaffSalary::where('user_id', $user->id)->first();
                $basicSalary = $salary ? $salary->basic_salary_amount : ($user->basic_salary ?? 0);
                
                $payslip = $this->generatePayslipData($user, $basicSalary, $id);
                
                return response()->json([
                    'status' => 200,
                    'payslip' => $payslip
                ]);
            }
            
            // Otherwise, look up by ID
            $payslip = DB::table('staff_salary_pay')
                ->where('id', $id)
                ->where('user_id', $user->id)
                ->first();
            
            if (!$payslip) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Payslip not found'
                ], 404);
            }
            
            return response()->json([
                'status' => 200,
                'payslip' => $payslip
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch payslip',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate payslip data for a given month
     */
    protected function generatePayslipData($user, $basicSalary, $month)
    {
        $salary = StaffSalary::where('user_id', $user->id)->first();
        $allowances = $salary ? ($salary->allocation_amount ?? 0) : 0;
        
        // Get overtime for the month
        $overtimeData = DB::table('employee_ot')
            ->where('employee_id', $user->id)
            ->whereRaw("strftime('%Y-%m', date) = ?", [$month])
            ->selectRaw('SUM(hours_worked) as hours, SUM(total_ot_amount) as amount')
            ->first();
        
        $overtimeHours = $overtimeData->hours ?? 0;
        $overtimeAmount = $overtimeData->amount ?? 0;
        
        // Get leaves taken (no pay deduction calculation)
        $noPayLeaves = 0; // Would need to track leave types
        $noPayDeduction = 0;
        
        // Calculate EPF/ETF (based on basic salary only - Sri Lanka law)
        $epfEmployee = $basicSalary * self::EPF_EMPLOYEE_RATE;
        $epfEmployer = $basicSalary * self::EPF_EMPLOYER_RATE;
        $etfEmployer = $basicSalary * self::ETF_EMPLOYER_RATE;
        
        // Gross salary
        $grossSalary = $basicSalary + $allowances + $overtimeAmount;
        
        // Total deductions
        $totalDeductions = $epfEmployee + $noPayDeduction;
        
        // Net salary
        $netSalary = $grossSalary - $totalDeductions;
        
        // Get bank details
        $bankDetails = EmployeeBankDetails::where('user_id', $user->id)->first();
        
        $roles = [
            1 => 'Super Admin', 2 => 'Branch Admin', 3 => 'Doctor',
            4 => 'Pharmacist', 5 => 'Nurse', 6 => 'Receptionist',
            7 => 'Cashier', 9 => 'IT Support', 10 => 'Center Aid', 11 => 'Auditor'
        ];
        
        return [
            'id' => 'PS-' . $month . '-' . substr($user->id, 0, 8),
            'month' => $month,
            'monthName' => \Carbon\Carbon::parse($month . '-01')->format('F Y'),
            'employee' => [
                'id' => 'EMP-' . substr($user->id, 0, 8),
                'name' => $user->first_name . ' ' . $user->last_name,
                'role' => $roles[$user->role_as] ?? 'Staff',
                'nic' => $user->nic,
                'email' => $user->email
            ],
            'earnings' => [
                'basicSalary' => round($basicSalary, 2),
                'allowances' => round($allowances, 2),
                'overtime' => [
                    'hours' => round($overtimeHours, 2),
                    'amount' => round($overtimeAmount, 2)
                ],
                'grossSalary' => round($grossSalary, 2)
            ],
            'deductions' => [
                'epfEmployee' => round($epfEmployee, 2),
                'noPayLeave' => round($noPayDeduction, 2),
                'otherDeductions' => 0,
                'totalDeductions' => round($totalDeductions, 2)
            ],
            'employerContributions' => [
                'epfEmployer' => round($epfEmployer, 2),
                'etfEmployer' => round($etfEmployer, 2),
                'totalContributions' => round($epfEmployer + $etfEmployer, 2)
            ],
            'netSalary' => round($netSalary, 2),
            'paymentDetails' => $bankDetails ? [
                'bank' => $bankDetails->bank_name,
                'accountNumber' => '****' . substr($bankDetails->account_number, -4),
                'accountName' => $bankDetails->account_owner_name
            ] : null,
            'generatedAt' => now()->toISOString(),
            'status' => 'generated'
        ];
    }

    /**
     * Get branch payroll summary (Branch Admin)
     * GET /api/hrm/branch-admin/payroll
     */
    public function getBranchPayroll(Request $request)
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
            
            // Get all staff with their salary info
            $query = User::query()
                ->leftJoin('staff_salary', 'users.id', '=', 'staff_salary.user_id')
                ->leftJoin('branches', 'users.branch_id', '=', 'branches.id')
                ->where('users.is_active', 1)
                ->where('users.role_as', '!=', 6);
            
            if ($branchId) {
                $query->where('users.branch_id', $branchId);
            }
            
            $staff = $query->select(
                    'users.id',
                    'users.first_name',
                    'users.last_name',
                    'users.role_as',
                    'users.basic_salary as user_basic_salary',
                    'staff_salary.basic_salary_amount',
                    'staff_salary.allocation_amount',
                    'branches.center_name as branch_name'
                )
                ->get();
            
            // Calculate payroll for each staff
            $payrollData = [];
            $totalBasic = 0;
            $totalAllowances = 0;
            $totalOT = 0;
            $totalEPFEmployee = 0;
            $totalEPFEmployer = 0;
            $totalETFEmployer = 0;
            $totalNet = 0;
            
            $roles = [
                1 => 'Super Admin', 2 => 'Branch Admin', 3 => 'Doctor',
                4 => 'Pharmacist', 5 => 'Nurse', 7 => 'Cashier',
                9 => 'IT Support', 10 => 'Center Aid', 11 => 'Auditor'
            ];
            
            foreach ($staff as $s) {
                $basicSalary = $s->basic_salary_amount ?? $s->user_basic_salary ?? 0;
                $allowances = $s->allocation_amount ?? 0;
                
                // Get OT for month
                $ot = DB::table('employee_ot')
                    ->where('employee_id', $s->id)
                    ->whereRaw("strftime('%Y-%m', date) = ?", [$month])
                    ->sum('total_ot_amount');
                
                $epfEmployee = $basicSalary * self::EPF_EMPLOYEE_RATE;
                $epfEmployer = $basicSalary * self::EPF_EMPLOYER_RATE;
                $etfEmployer = $basicSalary * self::ETF_EMPLOYER_RATE;
                
                $gross = $basicSalary + $allowances + $ot;
                $net = $gross - $epfEmployee;
                
                $payrollData[] = [
                    'id' => $s->id,
                    'name' => $s->first_name . ' ' . $s->last_name,
                    'role' => $roles[$s->role_as] ?? 'Staff',
                    'branch' => $s->branch_name ?? 'N/A',
                    'basic' => round($basicSalary, 2),
                    'allowances' => round($allowances, 2),
                    'overtime' => round($ot, 2),
                    'gross' => round($gross, 2),
                    'epfEmployee' => round($epfEmployee, 2),
                    'epfEmployer' => round($epfEmployer, 2),
                    'etfEmployer' => round($etfEmployer, 2),
                    'net' => round($net, 2)
                ];
                
                $totalBasic += $basicSalary;
                $totalAllowances += $allowances;
                $totalOT += $ot;
                $totalEPFEmployee += $epfEmployee;
                $totalEPFEmployer += $epfEmployer;
                $totalETFEmployer += $etfEmployer;
                $totalNet += $net;
            }
            
            return response()->json([
                'status' => 200,
                'payroll' => [
                    'month' => $month,
                    'monthName' => \Carbon\Carbon::parse($month . '-01')->format('F Y'),
                    'summary' => [
                        'staffCount' => count($payrollData),
                        'totalBasic' => round($totalBasic, 2),
                        'totalAllowances' => round($totalAllowances, 2),
                        'totalOvertime' => round($totalOT, 2),
                        'totalGross' => round($totalBasic + $totalAllowances + $totalOT, 2),
                        'totalEPFEmployee' => round($totalEPFEmployee, 2),
                        'totalEPFEmployer' => round($totalEPFEmployer, 2),
                        'totalETFEmployer' => round($totalETFEmployer, 2),
                        'totalDeductions' => round($totalEPFEmployee, 2),
                        'totalNet' => round($totalNet, 2),
                        'totalEmployerCost' => round($totalBasic + $totalAllowances + $totalOT + $totalEPFEmployer + $totalETFEmployer, 2)
                    ],
                    'staff' => $payrollData
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch payroll data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate payslips for a month (Branch Admin)
     * POST /api/hrm/branch-admin/generate-payslips
     */
    public function generatePayslips(Request $request)
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
                'month' => 'required|date_format:Y-m'
            ]);
            
            $month = $validated['month'];
            $branchId = $this->isBranchAdmin($user) ? $user->branch_id : $request->input('branch_id');
            
            // Get all staff for the branch
            $query = User::where('is_active', 1)
                ->where('role_as', '!=', 6);
            
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
            
            $staff = $query->get();
            $generated = 0;
            
            foreach ($staff as $s) {
                // Check if payslip already exists for this month
                $exists = DB::table('staff_salary_pay')
                    ->where('user_id', $s->id)
                    ->where('month', $month)
                    ->exists();
                
                if (!$exists) {
                    $salary = StaffSalary::where('user_id', $s->id)->first();
                    $basicSalary = $salary ? $salary->basic_salary_amount : ($s->basic_salary ?? 0);
                    $allowances = $salary ? ($salary->allocation_amount ?? 0) : 0;
                    
                    // Get OT
                    $ot = DB::table('employee_ot')
                        ->where('employee_id', $s->id)
                        ->whereRaw("strftime('%Y-%m', date) = ?", [$month])
                        ->sum('total_ot_amount');
                    
                    $epfEmployee = $basicSalary * self::EPF_EMPLOYEE_RATE;
                    $gross = $basicSalary + $allowances + $ot;
                    $net = $gross - $epfEmployee;
                    
                    // Insert using correct table structure
                    DB::table('staff_salary_pay')->insert([
                        'id' => Str::uuid()->toString(),
                        'user_id' => $s->id,
                        'branch_id' => $s->branch_id,
                        'paid_salary_amount' => $net,
                        'month' => $month,
                        'status' => 'generated',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    $generated++;
                }
            }
            
            return response()->json([
                'status' => 200,
                'message' => "Generated {$generated} payslips for {$month}",
                'generated' => $generated
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
                'message' => 'Failed to generate payslips',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
