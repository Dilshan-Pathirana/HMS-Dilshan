<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\SalaryStructure;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class SalaryStructureController extends Controller
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
     * Get all salary structures
     */
    public function index(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $query = SalaryStructure::with(['creator:id,first_name,last_name,email', 'branch:id,center_name'])
            ->orderBy('grade_code');

        // Filter by branch
        if ($request->has('branch_id') && $request->branch_id && $request->branch_id !== 'all') {
            $query->where('branch_id', $request->branch_id);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('grade_code', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $structures = $query->get();

        // Add computed fields
        $structures = $structures->map(function ($structure) {
            $structure->total_allowances = $structure->total_allowances;
            $structure->average_salary = $structure->average_salary;
            return $structure;
        });

        return response()->json([
            'status' => 200,
            'structures' => $structures
        ]);
    }

    /**
     * Get salary structure statistics
     */
    public function getStats(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $query = SalaryStructure::query();
        
        // Filter by branch if provided
        if ($request->has('branch_id') && $request->branch_id && $request->branch_id !== 'all') {
            $query->where('branch_id', $request->branch_id);
        }

        $total = (clone $query)->count();
        $active = (clone $query)->where('status', 'Active')->count();
        $inactive = (clone $query)->where('status', 'Inactive')->count();
        
        // Calculate average salary range across all active structures
        $avgMinSalary = (clone $query)->where('status', 'Active')->avg('min_salary') ?? 0;
        $avgMaxSalary = (clone $query)->where('status', 'Active')->avg('max_salary') ?? 0;
        
        // Get highest and lowest grades
        $highestGrade = (clone $query)->where('status', 'Active')
            ->orderBy('max_salary', 'desc')
            ->first();
        $lowestGrade = (clone $query)->where('status', 'Active')
            ->orderBy('min_salary', 'asc')
            ->first();

        return response()->json([
            'status' => 200,
            'stats' => [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'avg_min_salary' => round($avgMinSalary, 2),
                'avg_max_salary' => round($avgMaxSalary, 2),
                'highest_grade' => $highestGrade ? $highestGrade->grade_code : null,
                'lowest_grade' => $lowestGrade ? $lowestGrade->grade_code : null,
            ]
        ]);
    }

    /**
     * Get a single salary structure
     */
    public function show(Request $request, $id)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $structure = SalaryStructure::with(['creator:id,first_name,last_name,email'])
            ->find($id);

        if (!$structure) {
            return response()->json(['status' => 404, 'message' => 'Salary structure not found'], 404);
        }

        return response()->json([
            'status' => 200,
            'structure' => $structure
        ]);
    }

    /**
     * Create a new salary structure
     */
    public function store(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        // Build validation rules - grade_code must be unique per branch
        $branchId = $request->branch_id ?: null;
        
        $validator = Validator::make($request->all(), [
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'grade_code' => [
                'required',
                'string',
                'max:10',
                function ($attribute, $value, $fail) use ($branchId) {
                    $exists = SalaryStructure::where('grade_code', $value)
                        ->where('branch_id', $branchId)
                        ->exists();
                    if ($exists) {
                        $fail('This grade code already exists for the selected branch.');
                    }
                }
            ],
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'min_salary' => 'required|numeric|min:0',
            'max_salary' => 'required|numeric|min:0|gte:min_salary',
            // Basic Allowances
            'medical_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'housing_allowance' => 'nullable|numeric|min:0',
            'meal_allowance' => 'nullable|numeric|min:0',
            'other_allowance' => 'nullable|numeric|min:0',
            // Extended Allowances
            'q_pay' => 'nullable|numeric|min:0',
            'cost_of_living' => 'nullable|numeric|min:0',
            'uniform_allowance' => 'nullable|numeric|min:0',
            'cola_allowance' => 'nullable|numeric|min:0',
            'attendance_allowance' => 'nullable|numeric|min:0',
            'telephone_allowance' => 'nullable|numeric|min:0',
            'professional_allowance' => 'nullable|numeric|min:0',
            'shift_allowance' => 'nullable|numeric|min:0',
            'night_duty_allowance' => 'nullable|numeric|min:0',
            'on_call_allowance' => 'nullable|numeric|min:0',
            // Bonuses
            'annual_bonus' => 'nullable|numeric|min:0',
            'performance_bonus' => 'nullable|numeric|min:0',
            'festival_bonus' => 'nullable|numeric|min:0',
            'incentive_bonus' => 'nullable|numeric|min:0',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            // Statutory
            'epf_applicable' => 'boolean',
            'etf_applicable' => 'boolean',
            'paye_applicable' => 'boolean',
            // Deductions
            'welfare_fund' => 'nullable|numeric|min:0',
            'insurance_deduction' => 'nullable|numeric|min:0',
            'max_salary_advance' => 'nullable|numeric|min:0',
            'max_loan_amount' => 'nullable|numeric|min:0',
            // Overtime
            'overtime_rate_multiplier' => 'nullable|numeric|min:1|max:5',
            'holiday_rate_multiplier' => 'nullable|numeric|min:1|max:5',
            'status' => 'in:Active,Inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $structure = SalaryStructure::create([
            'branch_id' => $branchId,
            'grade_code' => $request->grade_code,
            'title' => $request->title,
            'description' => $request->description,
            'min_salary' => $request->min_salary,
            'max_salary' => $request->max_salary,
            // Basic Allowances
            'medical_allowance' => $request->medical_allowance ?? 0,
            'transport_allowance' => $request->transport_allowance ?? 0,
            'housing_allowance' => $request->housing_allowance ?? 0,
            'meal_allowance' => $request->meal_allowance ?? 0,
            'other_allowance' => $request->other_allowance ?? 0,
            // Extended Allowances
            'q_pay' => $request->q_pay ?? 0,
            'cost_of_living' => $request->cost_of_living ?? 0,
            'uniform_allowance' => $request->uniform_allowance ?? 0,
            'cola_allowance' => $request->cola_allowance ?? 0,
            'attendance_allowance' => $request->attendance_allowance ?? 0,
            'telephone_allowance' => $request->telephone_allowance ?? 0,
            'professional_allowance' => $request->professional_allowance ?? 0,
            'shift_allowance' => $request->shift_allowance ?? 0,
            'night_duty_allowance' => $request->night_duty_allowance ?? 0,
            'on_call_allowance' => $request->on_call_allowance ?? 0,
            // Bonuses
            'annual_bonus' => $request->annual_bonus ?? 0,
            'performance_bonus' => $request->performance_bonus ?? 0,
            'festival_bonus' => $request->festival_bonus ?? 0,
            'incentive_bonus' => $request->incentive_bonus ?? 0,
            'commission_rate' => $request->commission_rate ?? 0,
            // Statutory
            'epf_applicable' => $request->epf_applicable ?? true,
            'etf_applicable' => $request->etf_applicable ?? true,
            'paye_applicable' => $request->paye_applicable ?? false,
            // Deductions
            'welfare_fund' => $request->welfare_fund ?? 0,
            'insurance_deduction' => $request->insurance_deduction ?? 0,
            'max_salary_advance' => $request->max_salary_advance ?? 0,
            'max_loan_amount' => $request->max_loan_amount ?? 0,
            // Overtime
            'overtime_rate_multiplier' => $request->overtime_rate_multiplier ?? 1.50,
            'holiday_rate_multiplier' => $request->holiday_rate_multiplier ?? 2.00,
            'status' => $request->status ?? 'Active',
            'created_by' => $user->id,
        ]);

        return response()->json([
            'status' => 201,
            'message' => 'Salary structure created successfully',
            'structure' => $structure->load('branch:id,center_name')
        ], 201);
    }

    /**
     * Update a salary structure
     */
    public function update(Request $request, $id)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $structure = SalaryStructure::find($id);
        if (!$structure) {
            return response()->json(['status' => 404, 'message' => 'Salary structure not found'], 404);
        }

        // Build validation rules - grade_code must be unique per branch
        $branchId = $request->branch_id ?: null;

        $validator = Validator::make($request->all(), [
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'grade_code' => [
                'required',
                'string',
                'max:10',
                function ($attribute, $value, $fail) use ($branchId, $id) {
                    $exists = SalaryStructure::where('grade_code', $value)
                        ->where('branch_id', $branchId)
                        ->where('id', '!=', $id)
                        ->exists();
                    if ($exists) {
                        $fail('This grade code already exists for the selected branch.');
                    }
                }
            ],
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'min_salary' => 'required|numeric|min:0',
            'max_salary' => 'required|numeric|min:0|gte:min_salary',
            // Basic Allowances
            'medical_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'housing_allowance' => 'nullable|numeric|min:0',
            'meal_allowance' => 'nullable|numeric|min:0',
            'other_allowance' => 'nullable|numeric|min:0',
            // Extended Allowances
            'q_pay' => 'nullable|numeric|min:0',
            'cost_of_living' => 'nullable|numeric|min:0',
            'uniform_allowance' => 'nullable|numeric|min:0',
            'cola_allowance' => 'nullable|numeric|min:0',
            'attendance_allowance' => 'nullable|numeric|min:0',
            'telephone_allowance' => 'nullable|numeric|min:0',
            'professional_allowance' => 'nullable|numeric|min:0',
            'shift_allowance' => 'nullable|numeric|min:0',
            'night_duty_allowance' => 'nullable|numeric|min:0',
            'on_call_allowance' => 'nullable|numeric|min:0',
            // Bonuses
            'annual_bonus' => 'nullable|numeric|min:0',
            'performance_bonus' => 'nullable|numeric|min:0',
            'festival_bonus' => 'nullable|numeric|min:0',
            'incentive_bonus' => 'nullable|numeric|min:0',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            // Statutory
            'epf_applicable' => 'boolean',
            'etf_applicable' => 'boolean',
            'paye_applicable' => 'boolean',
            // Deductions
            'welfare_fund' => 'nullable|numeric|min:0',
            'insurance_deduction' => 'nullable|numeric|min:0',
            'max_salary_advance' => 'nullable|numeric|min:0',
            'max_loan_amount' => 'nullable|numeric|min:0',
            // Overtime
            'overtime_rate_multiplier' => 'nullable|numeric|min:1|max:5',
            'holiday_rate_multiplier' => 'nullable|numeric|min:1|max:5',
            'status' => 'in:Active,Inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $structure->update([
            'branch_id' => $branchId,
            'grade_code' => $request->grade_code,
            'title' => $request->title,
            'description' => $request->description,
            'min_salary' => $request->min_salary,
            'max_salary' => $request->max_salary,
            // Basic Allowances
            'medical_allowance' => $request->medical_allowance ?? 0,
            'transport_allowance' => $request->transport_allowance ?? 0,
            'housing_allowance' => $request->housing_allowance ?? 0,
            'meal_allowance' => $request->meal_allowance ?? 0,
            'other_allowance' => $request->other_allowance ?? 0,
            // Extended Allowances
            'q_pay' => $request->q_pay ?? 0,
            'cost_of_living' => $request->cost_of_living ?? 0,
            'uniform_allowance' => $request->uniform_allowance ?? 0,
            'cola_allowance' => $request->cola_allowance ?? 0,
            'attendance_allowance' => $request->attendance_allowance ?? 0,
            'telephone_allowance' => $request->telephone_allowance ?? 0,
            'professional_allowance' => $request->professional_allowance ?? 0,
            'shift_allowance' => $request->shift_allowance ?? 0,
            'night_duty_allowance' => $request->night_duty_allowance ?? 0,
            'on_call_allowance' => $request->on_call_allowance ?? 0,
            // Bonuses
            'annual_bonus' => $request->annual_bonus ?? 0,
            'performance_bonus' => $request->performance_bonus ?? 0,
            'festival_bonus' => $request->festival_bonus ?? 0,
            'incentive_bonus' => $request->incentive_bonus ?? 0,
            'commission_rate' => $request->commission_rate ?? 0,
            // Statutory
            'epf_applicable' => $request->epf_applicable ?? true,
            'etf_applicable' => $request->etf_applicable ?? true,
            'paye_applicable' => $request->paye_applicable ?? false,
            // Deductions
            'welfare_fund' => $request->welfare_fund ?? 0,
            'insurance_deduction' => $request->insurance_deduction ?? 0,
            'max_salary_advance' => $request->max_salary_advance ?? 0,
            'max_loan_amount' => $request->max_loan_amount ?? 0,
            // Overtime
            'overtime_rate_multiplier' => $request->overtime_rate_multiplier ?? 1.50,
            'holiday_rate_multiplier' => $request->holiday_rate_multiplier ?? 2.00,
            'status' => $request->status ?? 'Active',
            'updated_by' => $user->id,
        ]);

        return response()->json([
            'status' => 200,
            'message' => 'Salary structure updated successfully',
            'structure' => $structure->load('branch:id,center_name')
        ]);
    }

    /**
     * Delete a salary structure
     */
    public function destroy(Request $request, $id)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $structure = SalaryStructure::find($id);
        if (!$structure) {
            return response()->json(['status' => 404, 'message' => 'Salary structure not found'], 404);
        }

        // TODO: Check if structure is in use by any staff before deleting
        
        $structure->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Salary structure deleted successfully'
        ]);
    }

    /**
     * Get salary structures for dropdown (active only)
     */
    public function getForDropdown(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $query = SalaryStructure::where('status', 'Active')
            ->orderBy('grade_code');

        // Filter by branch if provided
        if ($request->has('branch_id') && $request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $structures = $query->get(['id', 'grade_code', 'title', 'min_salary', 'max_salary', 'branch_id']);

        return response()->json([
            'status' => 200,
            'structures' => $structures
        ]);
    }

    /**
     * Get all branches for dropdown
     */
    public function getBranches(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $branches = Branch::orderBy('center_name')
            ->get(['id', 'center_name', 'center_type', 'division']);

        return response()->json([
            'status' => 200,
            'branches' => $branches
        ]);
    }

    /**
     * Copy salary structures from one branch to another
     */
    public function copyToBranch(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'source_branch_id' => 'nullable|uuid|exists:branches,id',
            'target_branch_id' => 'required|uuid|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $sourceBranchId = $request->source_branch_id ?: null;
        $targetBranchId = $request->target_branch_id;

        // Get all structures from source branch
        $sourceStructures = SalaryStructure::where('branch_id', $sourceBranchId)->get();

        if ($sourceStructures->isEmpty()) {
            return response()->json([
                'status' => 404,
                'message' => 'No salary structures found in source branch'
            ], 404);
        }

        $copied = 0;
        $skipped = 0;

        foreach ($sourceStructures as $structure) {
            // Check if grade already exists in target branch
            $exists = SalaryStructure::where('grade_code', $structure->grade_code)
                ->where('branch_id', $targetBranchId)
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            // Create copy for target branch
            SalaryStructure::create([
                'branch_id' => $targetBranchId,
                'grade_code' => $structure->grade_code,
                'title' => $structure->title,
                'description' => $structure->description,
                'min_salary' => $structure->min_salary,
                'max_salary' => $structure->max_salary,
                'medical_allowance' => $structure->medical_allowance,
                'transport_allowance' => $structure->transport_allowance,
                'housing_allowance' => $structure->housing_allowance,
                'meal_allowance' => $structure->meal_allowance,
                'other_allowance' => $structure->other_allowance,
                'epf_applicable' => $structure->epf_applicable,
                'etf_applicable' => $structure->etf_applicable,
                'overtime_rate_multiplier' => $structure->overtime_rate_multiplier,
                'holiday_rate_multiplier' => $structure->holiday_rate_multiplier,
                'status' => $structure->status,
                'created_by' => $user->id,
            ]);

            $copied++;
        }

        return response()->json([
            'status' => 200,
            'message' => "Copied {$copied} salary structures. Skipped {$skipped} existing grades."
        ]);
    }
}
