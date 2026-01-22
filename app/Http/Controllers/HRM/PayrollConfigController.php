<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\HRM\PayrollConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PayrollConfigController extends Controller
{
    /**
     * Get authenticated user from token
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
     * Check if user is Super Admin
     */
    protected function isSuperAdmin($user): bool
    {
        return $user && $user->role === 'super_admin';
    }

    /**
     * Get payroll configuration for a branch (or global)
     * GET /api/hrm/super-admin/payroll-config
     */
    public function getConfig(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $branchId = $request->branch_id;
            if ($branchId === 'global' || $branchId === 'all' || $branchId === '') {
                $branchId = null;
            }

            $config = PayrollConfig::with('branch')
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->first();

            // If no config exists, return defaults
            if (!$config) {
                $defaults = PayrollConfig::getSriLankaDefaults();
                return response()->json([
                    'status' => 200,
                    'config' => $defaults,
                    'isDefault' => true,
                    'message' => 'Using default Sri Lanka payroll configuration'
                ]);
            }

            return response()->json([
                'status' => 200,
                'config' => $config,
                'isDefault' => false
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error fetching payroll config: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all payroll configurations
     * GET /api/hrm/super-admin/payroll-config/all
     */
    public function getAllConfigs(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $configs = PayrollConfig::with('branch')->get();

            return response()->json([
                'status' => 200,
                'configs' => $configs,
                'count' => $configs->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error fetching payroll configs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save payroll configuration
     * POST /api/hrm/super-admin/payroll-config
     */
    public function saveConfig(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'pay_period' => 'required|in:weekly,bi-weekly,monthly',
            'pay_day' => 'required|integer|min:1|max:31',
            'standard_hours_per_day' => 'required|numeric|min:1|max:24',
            'standard_hours_per_week' => 'required|numeric|min:1|max:168',
            'standard_days_per_month' => 'required|numeric|min:1|max:31',
            'overtime_rate' => 'required|numeric|min:1|max:5',
            'weekend_rate' => 'required|numeric|min:1|max:5',
            'holiday_rate' => 'required|numeric|min:1|max:5',
            'grace_period_minutes' => 'required|integer|min:0|max:60',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $branchId = $request->branch_id;
            if ($branchId === 'global' || $branchId === 'all' || $branchId === '') {
                $branchId = null;
            }

            // Find existing or create new
            $config = PayrollConfig::where('branch_id', $branchId)->first();

            $data = [
                'branch_id' => $branchId,
                'pay_period' => $request->pay_period,
                'pay_day' => $request->pay_day,
                'pay_cycle_start' => $request->pay_cycle_start ?? '1',
                'standard_hours_per_day' => $request->standard_hours_per_day,
                'standard_hours_per_week' => $request->standard_hours_per_week,
                'standard_days_per_month' => $request->standard_days_per_month,
                'overtime_rate' => $request->overtime_rate,
                'weekend_rate' => $request->weekend_rate,
                'holiday_rate' => $request->holiday_rate,
                'night_shift_allowance' => $request->night_shift_allowance ?? 0,
                'night_shift_rate' => $request->night_shift_rate ?? 1.10,
                'night_shift_start' => $request->night_shift_start ?? '22:00:00',
                'night_shift_end' => $request->night_shift_end ?? '06:00:00',
                'max_overtime_hours_per_day' => $request->max_overtime_hours_per_day ?? 4,
                'max_overtime_hours_per_week' => $request->max_overtime_hours_per_week ?? 16,
                'grace_period_minutes' => $request->grace_period_minutes,
                'half_day_threshold_hours' => $request->half_day_threshold_hours ?? 4,
                'late_deduction_per_minute' => $request->late_deduction_per_minute ?? 0,
                'absent_deduction_multiplier' => $request->absent_deduction_multiplier ?? 1,
                'unpaid_leave_deduction' => $request->unpaid_leave_deduction ?? true,
                'unpaid_leave_rate' => $request->unpaid_leave_rate ?? 1,
                'include_allowances_in_basic' => $request->include_allowances_in_basic ?? false,
                'include_allowances_in_epf' => $request->include_allowances_in_epf ?? false,
                'include_ot_in_epf' => $request->include_ot_in_epf ?? false,
                'auto_calculate_paye' => $request->auto_calculate_paye ?? true,
                'tax_free_threshold' => $request->tax_free_threshold ?? 100000,
                'rounding_method' => $request->rounding_method ?? 'normal',
                'rounding_precision' => $request->rounding_precision ?? 2,
                'currency_code' => $request->currency_code ?? 'LKR',
                'currency_symbol' => $request->currency_symbol ?? 'Rs.',
                'show_ytd_on_payslip' => $request->show_ytd_on_payslip ?? true,
                'show_leave_balance_on_payslip' => $request->show_leave_balance_on_payslip ?? true,
                'show_loan_balance_on_payslip' => $request->show_loan_balance_on_payslip ?? true,
                'payslip_template' => $request->payslip_template ?? 'default',
                'require_payroll_approval' => $request->require_payroll_approval ?? true,
                'approval_levels' => $request->approval_levels ?? 2,
                'is_active' => true,
                'updated_by' => $user->id,
            ];

            if ($config) {
                $config->update($data);
                $message = 'Payroll configuration updated successfully';
            } else {
                $data['created_by'] = $user->id;
                $config = PayrollConfig::create($data);
                $message = 'Payroll configuration created successfully';
            }

            return response()->json([
                'status' => 200,
                'message' => $message,
                'config' => $config->load('branch')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error saving payroll config: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Copy payroll config from one branch to another
     * POST /api/hrm/super-admin/payroll-config/copy-to-branch
     */
    public function copyToBranch(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'source_branch_id' => 'nullable|string',
            'target_branch_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $sourceBranchId = $request->source_branch_id;
            if ($sourceBranchId === 'global' || $sourceBranchId === 'all' || $sourceBranchId === '') {
                $sourceBranchId = null;
            }

            $targetBranchId = $request->target_branch_id;
            if ($targetBranchId === 'global' || $targetBranchId === 'all' || $targetBranchId === '') {
                $targetBranchId = null;
            }

            // Verify target branch exists (if not global)
            if ($targetBranchId) {
                $targetBranch = Branch::find($targetBranchId);
                if (!$targetBranch) {
                    return response()->json([
                        'status' => 404,
                        'message' => 'Target branch not found'
                    ], 404);
                }
            }

            // Get source config
            $sourceConfig = PayrollConfig::where('branch_id', $sourceBranchId)->first();

            if (!$sourceConfig) {
                // Use defaults if no source config
                $sourceData = PayrollConfig::getSriLankaDefaults();
            } else {
                $sourceData = $sourceConfig->toArray();
                unset($sourceData['id'], $sourceData['created_at'], $sourceData['updated_at'], $sourceData['branch']);
            }

            // Check if target already has config
            $existingTarget = PayrollConfig::where('branch_id', $targetBranchId)->first();
            
            if ($existingTarget) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Target branch already has payroll configuration. Update it directly instead.'
                ], 422);
            }

            // Create new config for target
            $sourceData['branch_id'] = $targetBranchId;
            $sourceData['created_by'] = $user->id;
            $sourceData['updated_by'] = $user->id;
            
            $newConfig = PayrollConfig::create($sourceData);

            return response()->json([
                'status' => 200,
                'message' => 'Payroll configuration copied successfully',
                'config' => $newConfig->load('branch')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error copying payroll config: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset to Sri Lanka defaults
     * POST /api/hrm/super-admin/payroll-config/reset
     */
    public function resetToDefault(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $branchId = $request->branch_id;
            if ($branchId === 'global' || $branchId === 'all' || $branchId === '') {
                $branchId = null;
            }

            $defaults = PayrollConfig::getSriLankaDefaults();
            $defaults['branch_id'] = $branchId;
            $defaults['updated_by'] = $user->id;

            $config = PayrollConfig::where('branch_id', $branchId)->first();

            if ($config) {
                $config->update($defaults);
            } else {
                $defaults['created_by'] = $user->id;
                $config = PayrollConfig::create($defaults);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Payroll configuration reset to Sri Lanka defaults',
                'config' => $config->load('branch')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error resetting payroll config: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate preview based on config
     * POST /api/hrm/super-admin/payroll-config/calculate
     */
    public function calculatePreview(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $branchId = $request->branch_id;
            if ($branchId === 'global' || $branchId === 'all' || $branchId === '') {
                $branchId = null;
            }

            $config = PayrollConfig::where('branch_id', $branchId)->first();
            
            if (!$config) {
                // Create temporary config from defaults
                $config = new PayrollConfig(PayrollConfig::getSriLankaDefaults());
            }

            $monthlySalary = $request->monthly_salary ?? 50000;
            $otHours = $request->ot_hours ?? 10;
            $weekendHours = $request->weekend_hours ?? 0;
            $holidayHours = $request->holiday_hours ?? 0;

            $dailyRate = $config->calculateDailyRate($monthlySalary);
            $hourlyRate = $config->calculateHourlyRate($monthlySalary);

            $calculations = [
                'monthly_salary' => $monthlySalary,
                'daily_rate' => $dailyRate,
                'hourly_rate' => $hourlyRate,
                'normal_ot_amount' => $config->calculateOvertime($hourlyRate, $otHours, 'normal'),
                'weekend_ot_amount' => $config->calculateOvertime($hourlyRate, $weekendHours, 'weekend'),
                'holiday_ot_amount' => $config->calculateOvertime($hourlyRate, $holidayHours, 'holiday'),
                'total_ot' => $config->calculateOvertime($hourlyRate, $otHours, 'normal') + 
                              $config->calculateOvertime($hourlyRate, $weekendHours, 'weekend') +
                              $config->calculateOvertime($hourlyRate, $holidayHours, 'holiday'),
            ];

            return response()->json([
                'status' => 200,
                'calculations' => $calculations,
                'config_used' => [
                    'overtime_rate' => $config->overtime_rate,
                    'weekend_rate' => $config->weekend_rate,
                    'holiday_rate' => $config->holiday_rate,
                    'standard_days_per_month' => $config->standard_days_per_month,
                    'standard_hours_per_day' => $config->standard_hours_per_day,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error calculating preview: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payroll config stats
     * GET /api/hrm/super-admin/payroll-config/stats
     */
    public function getStats(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            $totalConfigs = PayrollConfig::count();
            $globalConfig = PayrollConfig::whereNull('branch_id')->first();
            $branchConfigs = PayrollConfig::whereNotNull('branch_id')->count();

            return response()->json([
                'status' => 200,
                'stats' => [
                    'total' => $totalConfigs,
                    'hasGlobal' => $globalConfig !== null,
                    'branchSpecific' => $branchConfigs,
                ],
                'payPeriods' => PayrollConfig::getPayPeriods(),
                'roundingMethods' => PayrollConfig::getRoundingMethods(),
                'payslipTemplates' => PayrollConfig::getPayslipTemplates(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error fetching stats: ' . $e->getMessage()
            ], 500);
        }
    }
}
