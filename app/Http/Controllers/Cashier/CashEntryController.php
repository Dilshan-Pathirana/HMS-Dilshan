<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Models\Cashier\CashEntry;
use App\Models\Cashier\DailyCashSummary;
use App\Traits\EnforcesBranchIsolation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CashEntryController extends Controller
{
    use EnforcesBranchIsolation;
    /**
     * Create a new cash entry
     */
    public function createEntry(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'entry_type' => 'required|in:CASH_IN,CASH_OUT',
                'category' => 'required|in:PETTY_CASH,COURIER,EMERGENCY_PURCHASE,ADVANCE_PAYMENT,MISC_COLLECTION,ADJUSTMENT',
                'amount' => 'required|numeric|min:0',
                'description' => 'required|string|max:1000',
                'reference_number' => 'nullable|string|max:100',
                'remarks' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();

            // Check if EOD is locked
            $eodSummary = DailyCashSummary::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($today)
                ->first();

            if ($eodSummary && $eodSummary->eod_status === 'LOCKED') {
                return response()->json([
                    'status' => 403,
                    'message' => 'Cannot create cash entry. EOD is already locked for today.',
                ], 403);
            }

            DB::beginTransaction();

            $entry = CashEntry::create([
                'branch_id' => $branchId,
                'cashier_id' => $user->id,
                'entry_type' => $request->entry_type,
                'category' => $request->category,
                'amount' => $request->amount,
                'entry_date' => $today,
                'description' => $request->description,
                'reference_number' => $request->reference_number,
                'remarks' => $request->remarks,
                'approval_status' => 'PENDING',
                'is_locked' => false,
            ]);

            DB::commit();

            return response()->json([
                'status' => 201,
                'message' => 'Cash entry created successfully',
                'data' => $entry,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create cash entry error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create cash entry',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get cash entries for cashier
     */
    public function getEntries(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->input('date', Carbon::today()->format('Y-m-d'));

            $entries = CashEntry::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($date)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $entries,
            ]);
        } catch (\Exception $e) {
            Log::error('Get cash entries error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch cash entries',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get cash summary for a specific date
     */
    public function getCashSummary(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->input('date', Carbon::today()->format('Y-m-d'));

            $cashInTotal = CashEntry::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($date)
                ->cashIn()
                ->sum('amount');

            $cashOutTotal = CashEntry::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($date)
                ->cashOut()
                ->sum('amount');

            $cashInCount = CashEntry::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($date)
                ->cashIn()
                ->count();

            $cashOutCount = CashEntry::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($date)
                ->cashOut()
                ->count();

            return response()->json([
                'status' => 200,
                'data' => [
                    'date' => $date,
                    'cash_in_total' => (float) $cashInTotal,
                    'cash_in_count' => $cashInCount,
                    'cash_out_total' => (float) $cashOutTotal,
                    'cash_out_count' => $cashOutCount,
                    'net_cash' => (float) ($cashInTotal - $cashOutTotal),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get cash summary error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch cash summary',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
