<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\EPFETFConfig;
use App\Models\HRM\EPFETFRateHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class EPFETFConfigController extends Controller
{
    /**
     * Validate token and get user
     */
    private function validateToken(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }

        $accessToken = PersonalAccessToken::findToken($token);
        if (!$accessToken) {
            return null;
        }

        return $accessToken->tokenable;
    }

    /**
     * Get current EPF/ETF configuration
     */
    public function getConfig(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $branchId = $request->query('branch_id');
        
        // Build query based on branch selection
        $query = EPFETFConfig::with('branch:id,center_name')->where('is_active', true);
        
        if ($branchId && $branchId !== 'all') {
            if ($branchId === 'global') {
                $query->whereNull('branch_id');
            } else {
                $query->where('branch_id', $branchId);
            }
        }
        
        $config = $query->first();

        if (!$config) {
            // Return default values if no config exists
            return response()->json([
                'status' => 200,
                'config' => [
                    'id' => null,
                    'branch_id' => $branchId && $branchId !== 'all' && $branchId !== 'global' ? $branchId : null,
                    'epf_employee_rate' => 8.00,
                    'epf_employer_rate' => 12.00,
                    'etf_employer_rate' => 3.00,
                    'epf_registration_number' => '',
                    'etf_registration_number' => '',
                    'company_name' => '',
                    'company_address' => '',
                    'company_contact' => '',
                    'effective_from' => date('Y-m-d'),
                    'payment_due_date' => 15,
                    'auto_calculate' => true,
                    'is_active' => true,
                ],
                'is_default' => true
            ]);
        }

        return response()->json([
            'status' => 200,
            'config' => $config,
            'is_default' => false
        ]);
    }

    /**
     * Get all EPF/ETF configurations for listing
     */
    public function getAllConfigs(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $configs = EPFETFConfig::with('branch:id,center_name')
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 200,
            'configs' => $configs
        ]);
    }

    /**
     * Save or update EPF/ETF configuration
     */
    public function saveConfig(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'branch_id' => 'nullable|string',
            'epf_employee_rate' => 'required|numeric|min:0|max:100',
            'epf_employer_rate' => 'required|numeric|min:0|max:100',
            'etf_employer_rate' => 'required|numeric|min:0|max:100',
            'epf_registration_number' => 'nullable|string|max:50',
            'etf_registration_number' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'company_address' => 'nullable|string|max:500',
            'company_contact' => 'nullable|string|max:100',
            'effective_from' => 'required|date',
            'payment_due_date' => 'required|integer|min:1|max:28',
            'auto_calculate' => 'boolean',
            'change_reason' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle branch_id - treat 'global', 'all', empty as null
        $branchId = $request->branch_id;
        if (in_array($branchId, ['all', 'global', '', null], true)) {
            $branchId = null;
        }

        // Find existing config for this branch
        $query = EPFETFConfig::where('is_active', true);
        if ($branchId) {
            $query->where('branch_id', $branchId);
        } else {
            $query->whereNull('branch_id');
        }
        $existingConfig = $query->first();

        if ($existingConfig) {
            // Check if rates changed - if so, log history
            $ratesChanged = (
                $existingConfig->epf_employee_rate != $request->epf_employee_rate ||
                $existingConfig->epf_employer_rate != $request->epf_employer_rate ||
                $existingConfig->etf_employer_rate != $request->etf_employer_rate
            );

            if ($ratesChanged) {
                EPFETFRateHistory::create([
                    'config_id' => $existingConfig->id,
                    'old_epf_employee_rate' => $existingConfig->epf_employee_rate,
                    'new_epf_employee_rate' => $request->epf_employee_rate,
                    'old_epf_employer_rate' => $existingConfig->epf_employer_rate,
                    'new_epf_employer_rate' => $request->epf_employer_rate,
                    'old_etf_employer_rate' => $existingConfig->etf_employer_rate,
                    'new_etf_employer_rate' => $request->etf_employer_rate,
                    'effective_from' => $request->effective_from,
                    'change_reason' => $request->change_reason ?? 'Rate update',
                    'changed_by' => $user->id,
                ]);
            }

            // Update existing config
            $existingConfig->update([
                'epf_employee_rate' => $request->epf_employee_rate,
                'epf_employer_rate' => $request->epf_employer_rate,
                'etf_employer_rate' => $request->etf_employer_rate,
                'epf_registration_number' => $request->epf_registration_number,
                'etf_registration_number' => $request->etf_registration_number,
                'company_name' => $request->company_name,
                'company_address' => $request->company_address,
                'company_contact' => $request->company_contact,
                'effective_from' => $request->effective_from,
                'payment_due_date' => $request->payment_due_date,
                'auto_calculate' => $request->auto_calculate ?? true,
                'updated_by' => $user->id,
            ]);

            $config = $existingConfig;
        } else {
            // Create new config
            $config = EPFETFConfig::create([
                'branch_id' => $branchId,
                'epf_employee_rate' => $request->epf_employee_rate,
                'epf_employer_rate' => $request->epf_employer_rate,
                'etf_employer_rate' => $request->etf_employer_rate,
                'epf_registration_number' => $request->epf_registration_number,
                'etf_registration_number' => $request->etf_registration_number,
                'company_name' => $request->company_name,
                'company_address' => $request->company_address,
                'company_contact' => $request->company_contact,
                'effective_from' => $request->effective_from,
                'payment_due_date' => $request->payment_due_date,
                'auto_calculate' => $request->auto_calculate ?? true,
                'is_active' => true,
                'created_by' => $user->id,
            ]);
        }

        return response()->json([
            'status' => 200,
            'message' => 'EPF/ETF configuration saved successfully',
            'config' => $config
        ]);
    }

    /**
     * Calculate EPF/ETF for a given salary (preview)
     */
    public function calculatePreview(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'basic_salary' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $config = EPFETFConfig::where('is_active', true)->first();

        // Use default rates if no config
        $epfEmployeeRate = $config ? $config->epf_employee_rate : 8;
        $epfEmployerRate = $config ? $config->epf_employer_rate : 12;
        $etfEmployerRate = $config ? $config->etf_employer_rate : 3;

        $basicSalary = $request->basic_salary;

        $calculation = [
            'basic_salary' => $basicSalary,
            'epf_employee' => round($basicSalary * ($epfEmployeeRate / 100), 2),
            'epf_employer' => round($basicSalary * ($epfEmployerRate / 100), 2),
            'etf_employer' => round($basicSalary * ($etfEmployerRate / 100), 2),
            'total_epf' => round($basicSalary * (($epfEmployeeRate + $epfEmployerRate) / 100), 2),
            'total_employer_contribution' => round($basicSalary * (($epfEmployerRate + $etfEmployerRate) / 100), 2),
            'net_salary_after_epf' => round($basicSalary - ($basicSalary * ($epfEmployeeRate / 100)), 2),
            'rates' => [
                'epf_employee_rate' => $epfEmployeeRate,
                'epf_employer_rate' => $epfEmployerRate,
                'etf_employer_rate' => $etfEmployerRate,
            ]
        ];

        return response()->json([
            'status' => 200,
            'calculation' => $calculation
        ]);
    }

    /**
     * Get rate change history
     */
    public function getRateHistory(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $config = EPFETFConfig::where('is_active', true)->first();

        if (!$config) {
            return response()->json([
                'status' => 200,
                'history' => []
            ]);
        }

        $history = EPFETFRateHistory::where('config_id', $config->id)
            ->with('changedBy:id,first_name,last_name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 200,
            'history' => $history
        ]);
    }

    /**
     * Reset to default Sri Lanka rates
     */
    public function resetToDefault(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $config = EPFETFConfig::where('is_active', true)->first();

        if ($config) {
            // Log history before reset
            EPFETFRateHistory::create([
                'config_id' => $config->id,
                'old_epf_employee_rate' => $config->epf_employee_rate,
                'new_epf_employee_rate' => 8.00,
                'old_epf_employer_rate' => $config->epf_employer_rate,
                'new_epf_employer_rate' => 12.00,
                'old_etf_employer_rate' => $config->etf_employer_rate,
                'new_etf_employer_rate' => 3.00,
                'effective_from' => now(),
                'change_reason' => 'Reset to default Sri Lanka statutory rates',
                'changed_by' => $user->id,
            ]);

            $config->update([
                'epf_employee_rate' => 8.00,
                'epf_employer_rate' => 12.00,
                'etf_employer_rate' => 3.00,
                'updated_by' => $user->id,
            ]);
        }

        return response()->json([
            'status' => 200,
            'message' => 'Reset to default Sri Lanka rates (EPF 8%+12%, ETF 3%)',
            'config' => $config
        ]);
    }
}
