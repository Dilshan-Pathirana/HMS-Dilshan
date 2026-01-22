<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * STEP 15: Deductions Controller
 * Manages loan deductions, salary advances, no-pay deductions, etc.
 */
class HRMDeductionController extends Controller
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
     * Get all deduction types
     */
    public function getDeductionTypes(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $types = DB::table('deduction_types')
            ->where('is_active', true)
            ->orderBy('priority')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $types
        ]);
    }

    /**
     * Get employee's active deductions
     */
    public function getEmployeeDeductions(Request $request, $userId = null)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $targetUserId = $userId ?? $user->id;

        // Non-admins can only view their own
        if (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user) && $user->id !== $targetUserId) {
            return response()->json(['status' => 'error', 'message' => 'Access denied'], 403);
        }

        $deductions = DB::table('employee_deductions as ed')
            ->join('deduction_types as dt', 'ed.deduction_type_id', '=', 'dt.id')
            ->where('ed.user_id', $targetUserId)
            ->whereNull('ed.deleted_at')
            ->select(
                'ed.*',
                'dt.code as type_code',
                'dt.name as type_name',
                'dt.deduction_category'
            )
            ->orderBy('ed.status')
            ->orderBy('ed.start_date', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $deductions
        ]);
    }

    /**
     * Get all active deductions for payroll processing
     */
    public function getActiveDeductionsForPayroll(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $month = $request->input('month', date('Y-m'));

        $query = DB::table('employee_deductions as ed')
            ->join('deduction_types as dt', 'ed.deduction_type_id', '=', 'dt.id')
            ->join('users as u', 'ed.user_id', '=', 'u.id')
            ->where('ed.status', 'active')
            ->where('ed.start_date', '<=', $month . '-31')
            ->where(function($q) use ($month) {
                $q->whereNull('ed.end_date')
                  ->orWhere('ed.end_date', '>=', $month . '-01');
            })
            ->whereNull('ed.deleted_at')
            ->select(
                'ed.*',
                'dt.code as type_code',
                'dt.name as type_name',
                'dt.deduction_category',
                'u.first_name',
                'u.last_name',
                'u.employee_id',
                'u.branch_id'
            );

        if ($this->isBranchAdmin($user) && !$this->isSuperAdmin($user)) {
            $query->where('u.branch_id', $user->branch_id);
        }

        $deductions = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $deductions
        ]);
    }

    /**
     * Create a new employee deduction
     */
    public function createDeduction(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
            'deduction_type_id' => 'required|uuid|exists:deduction_types,id',
            'total_amount' => 'nullable|numeric|min:0',
            'monthly_amount' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'total_installments' => 'nullable|integer|min:1',
            'reason' => 'nullable|string'
        ]);

        $deductionId = Str::uuid()->toString();

        DB::table('employee_deductions')->insert([
            'id' => $deductionId,
            'user_id' => $request->user_id,
            'deduction_type_id' => $request->deduction_type_id,
            'total_amount' => $request->total_amount,
            'monthly_amount' => $request->monthly_amount,
            'balance_amount' => $request->total_amount,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'total_installments' => $request->total_installments,
            'completed_installments' => 0,
            'status' => 'active',
            'reason' => $request->reason,
            'approved_by' => $user->id,
            'approved_at' => now(),
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Deduction created successfully',
            'data' => ['id' => $deductionId]
        ], 201);
    }

    /**
     * Record a deduction transaction (during payroll)
     */
    public function recordDeductionTransaction(Request $request, $deductionId)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $deduction = DB::table('employee_deductions')
            ->where('id', $deductionId)
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->first();

        if (!$deduction) {
            return response()->json(['status' => 'error', 'message' => 'Deduction not found or inactive'], 404);
        }

        $amount = $request->input('amount', $deduction->monthly_amount);
        $newBalance = $deduction->balance_amount ? max(0, $deduction->balance_amount - $amount) : null;
        $newInstallmentCount = $deduction->completed_installments + 1;

        DB::beginTransaction();
        try {
            // Record transaction
            DB::table('deduction_transactions')->insert([
                'id' => Str::uuid()->toString(),
                'employee_deduction_id' => $deductionId,
                'payroll_item_id' => $request->input('payroll_item_id'),
                'deduction_date' => $request->input('deduction_date', date('Y-m-d')),
                'amount' => $amount,
                'balance_after' => $newBalance,
                'installment_number' => $newInstallmentCount,
                'remarks' => $request->input('remarks'),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Update deduction record
            $updateData = [
                'balance_amount' => $newBalance,
                'completed_installments' => $newInstallmentCount,
                'updated_at' => now()
            ];

            // Check if deduction is complete
            $isComplete = false;
            if ($deduction->total_installments && $newInstallmentCount >= $deduction->total_installments) {
                $isComplete = true;
            }
            if ($deduction->balance_amount !== null && $newBalance <= 0) {
                $isComplete = true;
            }

            if ($isComplete) {
                $updateData['status'] = 'completed';
                $updateData['end_date'] = date('Y-m-d');
            }

            DB::table('employee_deductions')
                ->where('id', $deductionId)
                ->update($updateData);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Deduction transaction recorded',
                'is_complete' => $isComplete
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Failed to record transaction'], 500);
        }
    }

    /**
     * Update deduction status (suspend, cancel)
     */
    public function updateDeductionStatus(Request $request, $deductionId)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'status' => 'required|in:active,suspended,cancelled'
        ]);

        $deduction = DB::table('employee_deductions')
            ->where('id', $deductionId)
            ->whereNull('deleted_at')
            ->first();

        if (!$deduction) {
            return response()->json(['status' => 'error', 'message' => 'Deduction not found'], 404);
        }

        if ($deduction->status === 'completed') {
            return response()->json(['status' => 'error', 'message' => 'Cannot modify completed deduction'], 400);
        }

        DB::table('employee_deductions')
            ->where('id', $deductionId)
            ->update([
                'status' => $request->status,
                'updated_at' => now()
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Deduction status updated'
        ]);
    }

    /**
     * Get deduction history/transactions
     */
    public function getDeductionHistory(Request $request, $deductionId)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $deduction = DB::table('employee_deductions')
            ->where('id', $deductionId)
            ->first();

        if (!$deduction) {
            return response()->json(['status' => 'error', 'message' => 'Deduction not found'], 404);
        }

        // Non-admins can only view their own
        if (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user) && $user->id !== $deduction->user_id) {
            return response()->json(['status' => 'error', 'message' => 'Access denied'], 403);
        }

        $transactions = DB::table('deduction_transactions')
            ->where('employee_deduction_id', $deductionId)
            ->orderBy('deduction_date', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'deduction' => $deduction,
                'transactions' => $transactions
            ]
        ]);
    }

    /**
     * Get deduction summary statistics
     */
    public function getDeductionStats(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $stats = [
            'active_loans' => DB::table('employee_deductions as ed')
                ->join('deduction_types as dt', 'ed.deduction_type_id', '=', 'dt.id')
                ->where('dt.deduction_category', 'loan')
                ->where('ed.status', 'active')
                ->count(),
            'total_loan_balance' => DB::table('employee_deductions as ed')
                ->join('deduction_types as dt', 'ed.deduction_type_id', '=', 'dt.id')
                ->where('dt.deduction_category', 'loan')
                ->where('ed.status', 'active')
                ->sum('ed.balance_amount'),
            'active_advances' => DB::table('employee_deductions as ed')
                ->join('deduction_types as dt', 'ed.deduction_type_id', '=', 'dt.id')
                ->where('dt.deduction_category', 'advance')
                ->where('ed.status', 'active')
                ->count(),
            'monthly_deductions' => DB::table('employee_deductions')
                ->where('status', 'active')
                ->sum('monthly_amount')
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }
}
