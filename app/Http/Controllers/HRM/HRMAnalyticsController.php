<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * STEP 19: HR Analytics Controller
 * Provides comprehensive HR reports and analytics
 */
class HRMAnalyticsController extends Controller
{
    private function validateToken(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        $accessToken = PersonalAccessToken::findToken($token);
        return $accessToken ? $accessToken->tokenable : null;
    }

    private function isSuperAdmin($user): bool
    {
        return $user && in_array($user->role, ['super_admin', 'admin']);
    }

    private function isBranchAdmin($user): bool
    {
        return $user && in_array($user->role, ['branch_admin', 'manager']);
    }

    /**
     * Get workforce analytics
     */
    public function getWorkforceAnalytics(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $branchFilter = $this->isBranchAdmin($user) && !$this->isSuperAdmin($user) 
            ? $user->branch_id 
            : $request->input('branch_id');

        $baseQuery = DB::table('users')
            ->where('is_active', 1)
            ->where('role_as', '!=', 'patient');

        if ($branchFilter) {
            $baseQuery->where('branch_id', $branchFilter);
        }

        // Headcount by role
        $byRole = (clone $baseQuery)
            ->select('role_as as role', DB::raw('count(*) as count'))
            ->groupBy('role_as')
            ->get();

        // Headcount by employment type
        $byEmploymentType = (clone $baseQuery)
            ->select('employment_type', DB::raw('count(*) as count'))
            ->groupBy('employment_type')
            ->get();

        // Headcount by branch
        $byBranch = DB::table('users as u')
            ->join('branches as b', 'u.branch_id', '=', 'b.id')
            ->where('u.is_active', 1)
            ->where('u.role_as', '!=', 'patient')
            ->select('b.center_name as branch_name', DB::raw('count(*) as count'))
            ->groupBy('b.id', 'b.center_name')
            ->get();

        // New hires this month
        $currentMonth = date('Y-m');
        $newHiresThisMonth = (clone $baseQuery)
            ->whereRaw("strftime('%Y-%m', joining_date) = ?", [$currentMonth])
            ->count();

        // Tenure distribution
        $tenureDistribution = [
            'less_than_1_year' => (clone $baseQuery)
                ->whereNotNull('joining_date')
                ->whereRaw("julianday('now') - julianday(joining_date) < 365")
                ->count(),
            '1_to_3_years' => (clone $baseQuery)
                ->whereNotNull('joining_date')
                ->whereRaw("julianday('now') - julianday(joining_date) >= 365")
                ->whereRaw("julianday('now') - julianday(joining_date) < 1095")
                ->count(),
            '3_to_5_years' => (clone $baseQuery)
                ->whereNotNull('joining_date')
                ->whereRaw("julianday('now') - julianday(joining_date) >= 1095")
                ->whereRaw("julianday('now') - julianday(joining_date) < 1825")
                ->count(),
            'more_than_5_years' => (clone $baseQuery)
                ->whereNotNull('joining_date')
                ->whereRaw("julianday('now') - julianday(joining_date) >= 1825")
                ->count()
        ];

        // EPF-enabled employees
        $epfEnabled = (clone $baseQuery)->where('epf_applicable', true)->count();
        $totalStaff = (clone $baseQuery)->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_staff' => $totalStaff,
                'by_role' => $byRole,
                'by_employment_type' => $byEmploymentType,
                'by_branch' => $byBranch,
                'new_hires_this_month' => $newHiresThisMonth,
                'tenure_distribution' => $tenureDistribution,
                'epf_coverage' => [
                    'enabled' => $epfEnabled,
                    'percentage' => $totalStaff > 0 ? round(($epfEnabled / $totalStaff) * 100, 1) : 0
                ]
            ]
        ]);
    }

    /**
     * Get attendance analytics
     */
    public function getAttendanceAnalytics(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $month = $request->input('month', date('Y-m'));
        $branchFilter = $this->isBranchAdmin($user) && !$this->isSuperAdmin($user) 
            ? $user->branch_id 
            : $request->input('branch_id');

        // Check if attendance_records table exists
        $tableExists = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance_records'");
        
        if (empty($tableExists)) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'message' => 'Attendance tracking not yet configured',
                    'summary' => []
                ]
            ]);
        }

        $baseQuery = DB::table('attendance_records as ar')
            ->join('users as u', 'ar.user_id', '=', 'u.id')
            ->whereRaw("strftime('%Y-%m', ar.attendance_date) = ?", [$month]);

        if ($branchFilter) {
            $baseQuery->where('u.branch_id', $branchFilter);
        }

        // Attendance summary
        $summary = (clone $baseQuery)
            ->select('ar.status', DB::raw('count(*) as count'))
            ->groupBy('ar.status')
            ->get();

        // Average work hours
        $avgHours = (clone $baseQuery)
            ->where('ar.status', 'present')
            ->avg('ar.actual_hours');

        // Late arrivals
        $lateCount = (clone $baseQuery)
            ->where('ar.late_minutes', '>', 0)
            ->count();

        // Overtime hours
        $totalOT = (clone $baseQuery)->sum('ar.overtime_hours');

        // Daily attendance trend
        $dailyTrend = (clone $baseQuery)
            ->select(DB::raw("date(ar.attendance_date) as day"), DB::raw('count(*) as total'), 
                DB::raw("sum(case when ar.status = 'present' then 1 else 0 end) as present"))
            ->groupBy(DB::raw("date(ar.attendance_date)"))
            ->orderBy('day')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'month' => $month,
                'summary' => $summary,
                'average_work_hours' => round($avgHours ?? 0, 2),
                'late_arrivals' => $lateCount,
                'total_overtime_hours' => round($totalOT ?? 0, 2),
                'daily_trend' => $dailyTrend
            ]
        ]);
    }

    /**
     * Get leave analytics
     */
    public function getLeaveAnalytics(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $year = $request->input('year', date('Y'));
        $branchFilter = $this->isBranchAdmin($user) && !$this->isSuperAdmin($user) 
            ? $user->branch_id 
            : $request->input('branch_id');

        // Check for leaves_management table (existing) or leave applications
        $leaveTable = 'leaves_management';
        $tableExists = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [$leaveTable]);
        
        if (empty($tableExists)) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'message' => 'Leave management not yet configured',
                    'summary' => []
                ]
            ]);
        }

        $baseQuery = DB::table($leaveTable . ' as l')
            ->join('users as u', 'l.user_id', '=', 'u.id')
            ->whereYear('l.leaves_start_date', $year);

        if ($branchFilter) {
            $baseQuery->where('u.branch_id', $branchFilter);
        }

        // Leave by type (using reason as type placeholder since leave_type doesn't exist)
        $byType = (clone $baseQuery)
            ->where('l.status', 'approved')
            ->select(DB::raw("'General Leave' as leave_type"), DB::raw('count(*) as count'), DB::raw('sum(l.leaves_days) as total_days'))
            ->get();

        // Leave by month
        $byMonth = (clone $baseQuery)
            ->where('l.status', 'approved')
            ->select(DB::raw("strftime('%m', l.leaves_start_date) as month"), DB::raw('count(*) as count'))
            ->groupBy(DB::raw("strftime('%m', l.leaves_start_date)"))
            ->orderBy('month')
            ->get();

        // Pending leaves
        $pendingCount = (clone $baseQuery)
            ->where('l.status', 'pending')
            ->count();

        // Approval rate
        $totalRequests = (clone $baseQuery)->count();
        $approvedRequests = (clone $baseQuery)->where('l.status', 'approved')->count();
        $approvalRate = $totalRequests > 0 ? round(($approvedRequests / $totalRequests) * 100, 1) : 0;

        // Average processing time
        $avgProcessingDays = DB::table($leaveTable)
            ->whereYear('leaves_start_date', $year)
            ->whereIn('status', ['approved', 'rejected'])
            ->whereNotNull('approval_date')
            ->selectRaw('AVG(julianday(approval_date) - julianday(created_at)) as avg_days')
            ->value('avg_days');

        return response()->json([
            'status' => 'success',
            'data' => [
                'year' => $year,
                'by_type' => $byType,
                'by_month' => $byMonth,
                'pending_count' => $pendingCount,
                'approval_rate' => $approvalRate,
                'avg_processing_days' => round($avgProcessingDays ?? 0, 1)
            ]
        ]);
    }

    /**
     * Get payroll analytics
     */
    public function getPayrollAnalytics(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $year = $request->input('year', date('Y'));

        // Check if payroll_runs table exists
        $tableExists = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='payroll_runs'");
        
        // Calculate from user salaries if payroll not processed
        $totalBasicSalary = DB::table('users')
            ->where('is_active', 1)
            ->where('role_as', '!=', 'patient')
            ->sum('basic_salary');

        // EPF/ETF calculations
        $epfEligibleSalary = DB::table('users')
            ->where('is_active', 1)
            ->where('role_as', '!=', 'patient')
            ->where('epf_applicable', true)
            ->sum('basic_salary');

        $epfEmployee = $epfEligibleSalary * 0.08;
        $epfEmployer = $epfEligibleSalary * 0.12;
        $etfEmployer = $epfEligibleSalary * 0.03;

        // Salary distribution by range
        $salaryRanges = [
            'below_50k' => DB::table('users')
                ->where('is_active', 1)
                ->where('role_as', '!=', 'patient')
                ->where('basic_salary', '<', 50000)
                ->count(),
            '50k_to_100k' => DB::table('users')
                ->where('is_active', 1)
                ->where('role_as', '!=', 'patient')
                ->whereBetween('basic_salary', [50000, 100000])
                ->count(),
            '100k_to_150k' => DB::table('users')
                ->where('is_active', 1)
                ->where('role_as', '!=', 'patient')
                ->whereBetween('basic_salary', [100001, 150000])
                ->count(),
            'above_150k' => DB::table('users')
                ->where('is_active', 1)
                ->where('role_as', '!=', 'patient')
                ->where('basic_salary', '>', 150000)
                ->count()
        ];

        // Payroll by branch
        $byBranch = DB::table('users as u')
            ->join('branches as b', 'u.branch_id', '=', 'b.id')
            ->where('u.is_active', 1)
            ->where('u.role_as', '!=', 'patient')
            ->select('b.center_name as branch_name', DB::raw('sum(u.basic_salary) as total_salary'), DB::raw('count(*) as staff_count'))
            ->groupBy('b.id', 'b.center_name')
            ->get();

        // Average salary by role
        $avgByRole = DB::table('users')
            ->where('is_active', 1)
            ->where('role_as', '!=', 'patient')
            ->select('role_as as role', DB::raw('avg(basic_salary) as avg_salary'), DB::raw('count(*) as count'))
            ->groupBy('role_as')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_monthly_payroll' => $totalBasicSalary,
                'statutory_contributions' => [
                    'epf_employee' => round($epfEmployee, 2),
                    'epf_employer' => round($epfEmployer, 2),
                    'etf_employer' => round($etfEmployer, 2),
                    'total' => round($epfEmployee + $epfEmployer + $etfEmployer, 2)
                ],
                'salary_distribution' => $salaryRanges,
                'by_branch' => $byBranch,
                'avg_salary_by_role' => $avgByRole
            ]
        ]);
    }

    /**
     * Get turnover analytics
     */
    public function getTurnoverAnalytics(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $year = $request->input('year', date('Y'));

        // New hires
        $newHires = DB::table('users')
            ->where('role_as', '!=', 'patient')
            ->whereYear('joining_date', $year)
            ->count();

        // Terminations (assuming we track this - using deleted users or status changes)
        $terminations = DB::table('users')
            ->where('role_as', '!=', 'patient')
            ->where('is_active', 0)
            ->whereYear('updated_at', $year)
            ->count();

        // Current headcount
        $currentHeadcount = DB::table('users')
            ->where('is_active', 1)
            ->where('role_as', '!=', 'patient')
            ->count();

        // New hires by month
        $hiresByMonth = DB::table('users')
            ->where('role_as', '!=', 'patient')
            ->whereNotNull('joining_date')
            ->whereYear('joining_date', $year)
            ->select(DB::raw("strftime('%m', joining_date) as month"), DB::raw('count(*) as count'))
            ->groupBy(DB::raw("strftime('%m', joining_date)"))
            ->orderBy('month')
            ->get();

        // Turnover rate calculation
        $avgHeadcount = $currentHeadcount > 0 ? $currentHeadcount : 1;
        $turnoverRate = round(($terminations / $avgHeadcount) * 100, 2);

        return response()->json([
            'status' => 'success',
            'data' => [
                'year' => $year,
                'new_hires' => $newHires,
                'terminations' => $terminations,
                'current_headcount' => $currentHeadcount,
                'turnover_rate' => $turnoverRate,
                'hires_by_month' => $hiresByMonth
            ]
        ]);
    }

    /**
     * Get overtime analytics
     */
    public function getOvertimeAnalytics(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $month = $request->input('month', date('Y-m'));
        $branchFilter = $this->isBranchAdmin($user) && !$this->isSuperAdmin($user) 
            ? $user->branch_id 
            : $request->input('branch_id');

        // Check if attendance_records table exists
        $tableExists = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance_records'");
        
        if (empty($tableExists)) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'message' => 'Overtime tracking not yet configured',
                    'summary' => []
                ]
            ]);
        }

        $baseQuery = DB::table('attendance_records as ar')
            ->join('users as u', 'ar.user_id', '=', 'u.id')
            ->whereRaw("strftime('%Y-%m', ar.attendance_date) = ?", [$month])
            ->where('ar.overtime_hours', '>', 0);

        if ($branchFilter) {
            $baseQuery->where('u.branch_id', $branchFilter);
        }

        // Total OT hours
        $totalOTHours = (clone $baseQuery)->sum('ar.overtime_hours');

        // OT by department/role
        $byRole = (clone $baseQuery)
            ->select('u.role_as as role', DB::raw('sum(ar.overtime_hours) as total_hours'), DB::raw('count(distinct u.id) as staff_count'))
            ->groupBy('u.role_as')
            ->get();

        // Top OT earners
        $topEarners = (clone $baseQuery)
            ->select('u.id', 'u.first_name', 'u.last_name', 'u.employee_id', DB::raw('sum(ar.overtime_hours) as total_hours'))
            ->groupBy('u.id', 'u.first_name', 'u.last_name', 'u.employee_id')
            ->orderBy('total_hours', 'desc')
            ->limit(10)
            ->get();

        // Daily OT trend
        $dailyTrend = (clone $baseQuery)
            ->select(DB::raw("date(ar.attendance_date) as day"), DB::raw('sum(ar.overtime_hours) as hours'))
            ->groupBy(DB::raw("date(ar.attendance_date)"))
            ->orderBy('day')
            ->get();

        // Estimated OT cost (assuming 1.5x hourly rate)
        $avgHourlyRate = DB::table('users')
            ->where('is_active', 1)
            ->where('role_as', '!=', 'patient')
            ->whereNotNull('basic_salary')
            ->selectRaw('AVG(basic_salary / 200) as avg_hourly')
            ->value('avg_hourly');

        $estimatedOTCost = $totalOTHours * ($avgHourlyRate ?? 0) * 1.5;

        return response()->json([
            'status' => 'success',
            'data' => [
                'month' => $month,
                'total_ot_hours' => round($totalOTHours ?? 0, 2),
                'estimated_ot_cost' => round($estimatedOTCost, 2),
                'by_role' => $byRole,
                'top_earners' => $topEarners,
                'daily_trend' => $dailyTrend
            ]
        ]);
    }

    /**
     * Get comprehensive HR dashboard data
     */
    public function getDashboardSummary(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $branchFilter = $this->isBranchAdmin($user) && !$this->isSuperAdmin($user) 
            ? $user->branch_id 
            : null;

        $baseQuery = DB::table('users')
            ->where('is_active', 1)
            ->where('role_as', '!=', 'patient');

        if ($branchFilter) {
            $baseQuery->where('branch_id', $branchFilter);
        }

        $totalStaff = (clone $baseQuery)->count();
        $totalPayroll = (clone $baseQuery)->sum('basic_salary');

        // EPF/ETF
        $epfEligiblePayroll = (clone $baseQuery)->where('epf_applicable', true)->sum('basic_salary');
        $epfEmployee = $epfEligiblePayroll * 0.08;
        $epfEmployer = $epfEligiblePayroll * 0.12;
        $etfEmployer = $epfEligiblePayroll * 0.03;

        // Pending items
        $pendingLeaves = DB::table('leaves_management')
            ->where('status', 'pending')
            ->count();

        $pendingIncrements = 0;
        $tableExists = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='salary_increments'");
        if (!empty($tableExists)) {
            $pendingIncrements = DB::table('salary_increments')
                ->where('status', 'pending')
                ->whereNull('deleted_at')
                ->count();
        }

        $pendingLetters = 0;
        $letterTableExists = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='hr_letter_requests'");
        if (!empty($letterTableExists)) {
            $pendingLetters = DB::table('hr_letter_requests')
                ->where('status', 'pending')
                ->whereNull('deleted_at')
                ->count();
        }

        $openComplaints = 0;
        $complaintTableExists = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='hr_complaints'");
        if (!empty($complaintTableExists)) {
            $openComplaints = DB::table('hr_complaints')
                ->whereIn('status', ['submitted', 'under_review', 'investigation'])
                ->whereNull('deleted_at')
                ->count();
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'workforce' => [
                    'total_staff' => $totalStaff,
                    'total_payroll' => $totalPayroll
                ],
                'statutory' => [
                    'epf_employee' => round($epfEmployee, 2),
                    'epf_employer' => round($epfEmployer, 2),
                    'etf_employer' => round($etfEmployer, 2),
                    'total' => round($epfEmployee + $epfEmployer + $etfEmployer, 2)
                ],
                'pending_actions' => [
                    'leave_requests' => $pendingLeaves,
                    'salary_increments' => $pendingIncrements,
                    'letter_requests' => $pendingLetters,
                    'open_complaints' => $openComplaints
                ]
            ]
        ]);
    }
}
