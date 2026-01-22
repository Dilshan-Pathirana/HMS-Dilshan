<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Models\Cashier\BillingTransaction;
use App\Models\Cashier\CashEntry;
use App\Models\Cashier\DailyCashSummary;
use App\Services\POSAuditService;
use App\Traits\EnforcesBranchIsolation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class EODController extends Controller
{
    use EnforcesBranchIsolation;
    /**
     * Get or create EOD summary for today
     * Always recalculates values if the summary is still OPEN
     */
    public function getEODSummary(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->input('date', Carbon::today()->format('Y-m-d'));

            $summary = DailyCashSummary::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($date)
                ->first();

            if (!$summary) {
                // Create new summary
                $summary = $this->calculateDailySummary($branchId, $user->id, $date);
            } elseif ($summary->eod_status === 'OPEN') {
                // Recalculate values for OPEN summaries to get latest transaction data
                $summary = $this->recalculateSummary($summary, $branchId, $user->id, $date);
            }

            return response()->json([
                'status' => 200,
                'data' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Get EOD summary error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch EOD summary',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Submit EOD with cash counting
     */
    public function submitEOD(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'actual_cash_counted' => 'required|numeric|min:0',
                'variance_remarks' => 'nullable|string|max:1000',
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

            DB::beginTransaction();

            // Get or create summary
            $summary = DailyCashSummary::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($today)
                ->first();

            if (!$summary) {
                $summary = $this->calculateDailySummary($branchId, $user->id, $today);
            }

            // Check if already submitted
            if ($summary->eod_status !== 'OPEN') {
                return response()->json([
                    'status' => 400,
                    'message' => 'EOD has already been submitted for today',
                ], 400);
            }

            // Update summary with actual cash counted
            $actualCashCounted = $request->actual_cash_counted;
            $cashVariance = $actualCashCounted - $summary->expected_cash_balance;

            $summary->update([
                'actual_cash_counted' => $actualCashCounted,
                'cash_variance' => $cashVariance,
                'variance_remarks' => $request->variance_remarks ?? ($cashVariance != 0 ? 'Variance detected' : null),
                'eod_status' => 'SUBMITTED',
                'submitted_at' => Carbon::now(),
            ]);

            // Lock all transactions and cash entries for today
            BillingTransaction::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($today)
                ->update([
                    'is_locked' => true,
                    'eod_summary_id' => $summary->id,
                ]);

            CashEntry::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($today)
                ->update([
                    'is_locked' => true,
                    'eod_summary_id' => $summary->id,
                ]);

            DB::commit();

            // Audit log: EOD submitted
            POSAuditService::logEODSubmit($summary->id, [
                'date' => $today->format('Y-m-d'),
                'total_transactions' => $summary->transaction_count,
                'total_amount' => $summary->total_collected,
                'expected_cash' => $summary->expected_cash_balance,
                'actual_cash' => $actualCashCounted,
                'variance' => $cashVariance,
            ], $branchId);

            return response()->json([
                'status' => 200,
                'message' => 'EOD submitted successfully',
                'data' => $summary->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Submit EOD error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to submit EOD',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate daily summary
     */
    private function calculateDailySummary($branchId, $cashierId, $date)
    {
        // Get all transactions for the day
        $transactions = BillingTransaction::forBranch($branchId)
            ->forCashier($cashierId)
            ->forDate($date)
            ->get();

        // Calculate payment mode breakdown
        $cashTotal = $transactions->where('payment_method', 'CASH')->sum('paid_amount');
        $cashCount = $transactions->where('payment_method', 'CASH')->count();
        $cardTotal = $transactions->where('payment_method', 'CARD')->sum('paid_amount');
        $cardCount = $transactions->where('payment_method', 'CARD')->count();
        $onlineTotal = $transactions->where('payment_method', 'ONLINE')->sum('paid_amount');
        $onlineCount = $transactions->where('payment_method', 'ONLINE')->count();
        $qrTotal = $transactions->where('payment_method', 'QR')->sum('paid_amount');
        $qrCount = $transactions->where('payment_method', 'QR')->count();

        // Get cash entries
        $cashInTotal = CashEntry::forBranch($branchId)
            ->forCashier($cashierId)
            ->forDate($date)
            ->cashIn()
            ->sum('amount');

        $cashOutTotal = CashEntry::forBranch($branchId)
            ->forCashier($cashierId)
            ->forDate($date)
            ->cashOut()
            ->sum('amount');

        // Calculate expected cash balance
        $expectedCashBalance = $cashTotal + $cashInTotal - $cashOutTotal;

        return DailyCashSummary::create([
            'branch_id' => $branchId,
            'cashier_id' => $cashierId,
            'summary_date' => $date,
            'total_transactions' => $transactions->count(),
            'total_sales' => $transactions->sum('paid_amount'),
            'cash_total' => $cashTotal,
            'cash_count' => $cashCount,
            'card_total' => $cardTotal,
            'card_count' => $cardCount,
            'online_total' => $onlineTotal,
            'online_count' => $onlineCount,
            'qr_total' => $qrTotal,
            'qr_count' => $qrCount,
            'cash_in_total' => $cashInTotal,
            'cash_out_total' => $cashOutTotal,
            'expected_cash_balance' => $expectedCashBalance,
            'eod_status' => 'OPEN',
        ]);
    }

    /**
     * Recalculate an existing OPEN summary with latest transaction data
     */
    private function recalculateSummary($summary, $branchId, $cashierId, $date)
    {
        // Get all transactions for the day
        $transactions = BillingTransaction::forBranch($branchId)
            ->forCashier($cashierId)
            ->forDate($date)
            ->get();

        // Calculate payment mode breakdown
        $cashTotal = $transactions->where('payment_method', 'CASH')->sum('paid_amount');
        $cashCount = $transactions->where('payment_method', 'CASH')->count();
        $cardTotal = $transactions->where('payment_method', 'CARD')->sum('paid_amount');
        $cardCount = $transactions->where('payment_method', 'CARD')->count();
        $onlineTotal = $transactions->where('payment_method', 'ONLINE')->sum('paid_amount');
        $onlineCount = $transactions->where('payment_method', 'ONLINE')->count();
        $qrTotal = $transactions->where('payment_method', 'QR')->sum('paid_amount');
        $qrCount = $transactions->where('payment_method', 'QR')->count();

        // Get cash entries
        $cashInTotal = CashEntry::forBranch($branchId)
            ->forCashier($cashierId)
            ->forDate($date)
            ->cashIn()
            ->sum('amount');

        $cashOutTotal = CashEntry::forBranch($branchId)
            ->forCashier($cashierId)
            ->forDate($date)
            ->cashOut()
            ->sum('amount');

        // Calculate expected cash balance
        $expectedCashBalance = $cashTotal + $cashInTotal - $cashOutTotal;

        // Update the existing summary
        $summary->update([
            'total_transactions' => $transactions->count(),
            'total_sales' => $transactions->sum('paid_amount'),
            'cash_total' => $cashTotal,
            'cash_count' => $cashCount,
            'card_total' => $cardTotal,
            'card_count' => $cardCount,
            'online_total' => $onlineTotal,
            'online_count' => $onlineCount,
            'qr_total' => $qrTotal,
            'qr_count' => $qrCount,
            'cash_in_total' => $cashInTotal,
            'cash_out_total' => $cashOutTotal,
            'expected_cash_balance' => $expectedCashBalance,
        ]);

        return $summary->fresh();
    }

    /**
     * Get EOD history
     */
    public function getEODHistory(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $limit = $request->input('limit', 10);

            $summaries = DailyCashSummary::forBranch($branchId)
                ->forCashier($user->id)
                ->orderBy('summary_date', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $summaries,
            ]);
        } catch (\Exception $e) {
            Log::error('Get EOD history error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch EOD history',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
