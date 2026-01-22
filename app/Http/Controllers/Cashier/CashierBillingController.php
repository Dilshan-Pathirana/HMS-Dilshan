<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Models\Cashier\BillingTransaction;
use App\Models\Cashier\CashEntry;
use App\Models\Cashier\DailyCashSummary;
use App\Models\Notification;
use App\Models\AllUsers\User;
use App\Services\POSAuditService;
use App\Traits\EnforcesBranchIsolation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CashierBillingController extends Controller
{
    use EnforcesBranchIsolation;
    /**
     * Get cashier dashboard stats
     */
    public function getDashboardStats(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();

            // Today's stats
            $todayTransactions = BillingTransaction::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($today)
                ->get();

            $todaySales = $todayTransactions->sum('paid_amount');
            $transactionCount = $todayTransactions->count();

            // Payment mode breakdown
            $paymentBreakdown = [
                'cash' => $todayTransactions->where('payment_method', 'CASH')->sum('paid_amount'),
                'card' => $todayTransactions->where('payment_method', 'CARD')->sum('paid_amount'),
                'online' => $todayTransactions->where('payment_method', 'ONLINE')->sum('paid_amount'),
                'qr' => $todayTransactions->where('payment_method', 'QR')->sum('paid_amount'),
            ];

            // Cash entries
            $todayCashIn = CashEntry::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($today)
                ->cashIn()
                ->sum('amount');

            $todayCashOut = CashEntry::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($today)
                ->cashOut()
                ->sum('amount');

            // EOD status
            $eodSummary = DailyCashSummary::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($today)
                ->first();

            $eodStatus = $eodSummary ? $eodSummary->eod_status : 'OPEN';
            $isEodLocked = $eodSummary && $eodSummary->eod_status === 'LOCKED';

            // Branch info
            $branch = $user->branch;

            return response()->json([
                'status' => 200,
                'data' => [
                    'branch' => [
                        'id' => $branch->id ?? null,
                        'name' => $branch->center_name ?? 'Unknown Branch',
                        'type' => $branch->center_type ?? null,
                        'address' => $branch->address ?? '',
                        'city' => $branch->city ?? '',
                        'phone' => $branch->phone_number ?? '',
                    ],
                    'cashier' => [
                        'id' => $user->id,
                        'name' => $user->name,
                    ],
                    'today_stats' => [
                        'date' => $today->format('Y-m-d'),
                        'total_sales' => (float) $todaySales,
                        'transaction_count' => $transactionCount,
                        'cash_in' => (float) $todayCashIn,
                        'cash_out' => (float) $todayCashOut,
                    ],
                    'payment_breakdown' => $paymentBreakdown,
                    'eod_status' => $eodStatus,
                    'is_eod_locked' => $isEodLocked,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Cashier dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new billing transaction (POS)
     */
    public function createTransaction(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'transaction_type' => 'required|in:OPD,LAB,PHARMACY,SERVICE',
                'patient_id' => 'nullable|string',
                'patient_name' => 'required|string|max:255',
                'patient_phone' => 'nullable|string|max:20',
                'service_details' => 'required|array|min:1',
                'total_amount' => 'required|numeric|min:0',
                'paid_amount' => 'required|numeric|min:0',
                'payment_method' => 'required|in:CASH,CARD,ONLINE,QR',
                'remarks' => 'nullable|string',
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
                    'message' => 'Cannot create transaction. EOD is already locked for today.',
                ], 403);
            }

            // Validate all items have valid product_id and prices match database
            // Cashiers cannot modify prices - prices must come from product database
            $calculatedTotal = 0;
            foreach ($request->service_details as $item) {
                if (empty($item['product_id'])) {
                    return response()->json([
                        'status' => 422,
                        'message' => 'All items must be valid products from inventory. Manual entries are not allowed.',
                    ], 422);
                }
                
                // Verify product exists and get correct price from products_stock
                $product = DB::table('products')
                    ->join('products_stock', 'products.id', '=', 'products_stock.product_id')
                    ->where('products.id', $item['product_id'])
                    ->where('products_stock.branch_id', $branchId)
                    ->select('products.id', 'products.item_name', 'products_stock.unit_selling_price as selling_price')
                    ->first();
                
                // If not found for branch, try without branch filter
                if (!$product) {
                    $product = DB::table('products')
                        ->join('products_stock', 'products.id', '=', 'products_stock.product_id')
                        ->where('products.id', $item['product_id'])
                        ->select('products.id', 'products.item_name', 'products_stock.unit_selling_price as selling_price')
                        ->first();
                }
                
                if (!$product) {
                    return response()->json([
                        'status' => 422,
                        'message' => 'Invalid product ID: ' . $item['product_id'],
                    ], 422);
                }
                
                $quantity = $item['quantity'] ?? 1;
                $expectedAmount = $product->selling_price * $quantity;
                $submittedAmount = floatval($item['amount']);
                
                // Allow small tolerance for floating point differences (1 cent)
                if (abs($expectedAmount - $submittedAmount) > 0.01) {
                    return response()->json([
                        'status' => 422,
                        'message' => 'Price mismatch for product: ' . $product->item_name . '. Expected: ' . $expectedAmount . ', Got: ' . $submittedAmount,
                    ], 422);
                }
                
                $calculatedTotal += $expectedAmount;
            }

            DB::beginTransaction();

            $totalAmount = $request->total_amount;
            $paidAmount = $request->paid_amount;
            $balanceAmount = $totalAmount - $paidAmount;

            $paymentStatus = 'PAID';
            if ($balanceAmount > 0) {
                $paymentStatus = 'PARTIAL';
            } else if ($paidAmount == 0) {
                $paymentStatus = 'PENDING';
            }

            // Generate unique invoice and receipt numbers
            $invoiceNumber = $this->generateInvoiceNumber($branchId);
            $receiptNumber = $this->generateReceiptNumber($branchId);

            $transaction = BillingTransaction::create([
                'branch_id' => $branchId,
                'cashier_id' => $user->id,
                'patient_id' => $request->patient_id,
                'transaction_type' => $request->transaction_type,
                'invoice_number' => $invoiceNumber,
                'receipt_number' => $receiptNumber,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'balance_amount' => $balanceAmount,
                'payment_status' => $paymentStatus,
                'payment_method' => $request->payment_method,
                'service_details' => $request->service_details,
                'remarks' => $request->remarks,
                'patient_name' => $request->patient_name,
                'patient_phone' => $request->patient_phone,
                'transaction_date' => $today,
                'is_locked' => false,
            ]);

            // Update stock levels for products
            $lowStockItems = [];
            foreach ($request->service_details as $item) {
                if (!empty($item['product_id'])) {
                    $quantity = $item['quantity'] ?? 1;
                    
                    // Update product stock
                    $stockUpdated = DB::table('products_stock')
                        ->where('product_id', $item['product_id'])
                        ->decrement('current_stock', $quantity);
                    
                    if ($stockUpdated) {
                        // Check if stock is low after update
                        $stockRecord = DB::table('products_stock')
                            ->join('products', 'products.id', '=', 'products_stock.product_id')
                            ->where('products_stock.product_id', $item['product_id'])
                            ->select(
                                'products.item_name',
                                'products.item_code',
                                'products_stock.current_stock',
                                'products_stock.min_stock',
                                'products_stock.reorder_level'
                            )
                            ->first();
                        
                        if ($stockRecord) {
                            $reorderLevel = $stockRecord->reorder_level ?? $stockRecord->min_stock ?? 10;
                            if ($stockRecord->current_stock <= $reorderLevel) {
                                $lowStockItems[] = [
                                    'name' => $stockRecord->item_name,
                                    'code' => $stockRecord->item_code,
                                    'current_stock' => $stockRecord->current_stock,
                                    'reorder_level' => $reorderLevel,
                                ];
                            }
                        }
                    }
                }
            }

            // Create low stock notifications
            if (!empty($lowStockItems)) {
                $this->createLowStockNotifications($lowStockItems, $branchId, $user);
            }

            // Update daily summary
            $this->updateDailySummary($branchId, $user->id, $paidAmount, $request->payment_method);

            DB::commit();

            // Audit log: Transaction created
            POSAuditService::logTransaction($transaction->id, [
                'invoice_number' => $transaction->invoice_number,
                'total_amount' => $transaction->total_amount,
                'payment_method' => $transaction->payment_method,
                'patient_name' => $transaction->patient_name,
                'items_count' => count($request->items ?? []),
            ], $branchId);

            return response()->json([
                'status' => 201,
                'message' => 'Transaction created successfully',
                'data' => $transaction,
                'low_stock_warning' => !empty($lowStockItems) ? $lowStockItems : null,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create transaction error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create transaction',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get transactions for cashier
     */
    public function getTransactions(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->input('date', Carbon::today()->format('Y-m-d'));

            $transactions = BillingTransaction::forBranch($branchId)
                ->forCashier($user->id)
                ->forDate($date)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $transactions,
            ]);
        } catch (\Exception $e) {
            Log::error('Get transactions error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch transactions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate unique invoice number
     */
    private function generateInvoiceNumber($branchId): string
    {
        $date = Carbon::now()->format('Ymd');
        $branchCode = strtoupper(substr($branchId, 0, 4));
        $count = BillingTransaction::forBranch($branchId)
            ->whereDate('created_at', Carbon::today())
            ->count() + 1;

        return "INV-{$branchCode}-{$date}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate unique receipt number
     */
    private function generateReceiptNumber($branchId): string
    {
        $date = Carbon::now()->format('Ymd');
        $branchCode = strtoupper(substr($branchId, 0, 4));
        $count = BillingTransaction::forBranch($branchId)
            ->whereDate('created_at', Carbon::today())
            ->count() + 1;

        return "RCP-{$branchCode}-{$date}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Create low stock notifications for relevant users
     */
    private function createLowStockNotifications(array $lowStockItems, $branchId, $currentUser): void
    {
        try {
            foreach ($lowStockItems as $item) {
                $title = 'Low Stock Alert';
                $message = "Product '{$item['name']}' (Code: {$item['code']}) is running low. Current stock: {$item['current_stock']} units. Reorder level: {$item['reorder_level']} units.";

                // Notify branch admin and pharmacists
                $usersToNotify = User::where('branch_id', $branchId)
                    ->whereIn('role', ['branch_admin', 'pharmacist', 'super_admin'])
                    ->pluck('id');

                foreach ($usersToNotify as $userId) {
                    // Check if a similar notification exists in the last 24 hours
                    $existingNotification = Notification::where('user_id', $userId)
                        ->where('type', 'low_stock')
                        ->where('title', $title)
                        ->where('message', 'LIKE', "%{$item['code']}%")
                        ->where('created_at', '>=', Carbon::now()->subHours(24))
                        ->exists();

                    if (!$existingNotification) {
                        Notification::create([
                            'user_id' => $userId,
                            'type' => 'low_stock',
                            'title' => $title,
                            'message' => $message,
                            'related_type' => 'product',
                            'related_id' => $item['code'],
                            'status' => 'sent',
                            'channel' => 'in_app',
                            'sent_at' => now(),
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to create low stock notification: ' . $e->getMessage());
        }
    }

    /**
     * Update daily cash summary
     */
    private function updateDailySummary($branchId, $cashierId, $amount, $paymentMethod): void
    {
        try {
            $today = Carbon::today();
            
            $summary = DailyCashSummary::firstOrCreate(
                [
                    'branch_id' => $branchId,
                    'cashier_id' => $cashierId,
                    'summary_date' => $today,
                ],
                [
                    'opening_balance' => 0,
                    'total_sales' => 0,
                    'total_cash_in' => 0,
                    'total_cash_out' => 0,
                    'expected_balance' => 0,
                    'actual_balance' => 0,
                    'difference' => 0,
                    'eod_status' => 'OPEN',
                ]
            );

            // Update sales totals
            $summary->total_sales += $amount;
            
            // Update expected balance (cash transactions increase expected balance)
            if ($paymentMethod === 'CASH') {
                $summary->expected_balance += $amount;
            }
            
            $summary->save();
        } catch (\Exception $e) {
            Log::error('Failed to update daily summary: ' . $e->getMessage());
        }
    }

    /**
     * Get sales report data
     */
    public function getSalesReport(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $reportType = $request->input('type', 'daily'); // daily, weekly, monthly
            $date = $request->input('date', Carbon::today()->format('Y-m-d'));

            $startDate = Carbon::parse($date);
            $endDate = Carbon::parse($date);

            switch ($reportType) {
                case 'weekly':
                    $startDate = $startDate->startOfWeek();
                    $endDate = $endDate->endOfWeek();
                    break;
                case 'monthly':
                    $startDate = $startDate->startOfMonth();
                    $endDate = $endDate->endOfMonth();
                    break;
                default:
                    // Daily - same date
                    break;
            }

            // Transaction summary
            $transactions = BillingTransaction::forBranch($branchId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->get();

            $totalSales = $transactions->sum('paid_amount');
            $totalTransactions = $transactions->count();
            
            // Payment method breakdown
            $paymentBreakdown = [
                'CASH' => $transactions->where('payment_method', 'CASH')->sum('paid_amount'),
                'CARD' => $transactions->where('payment_method', 'CARD')->sum('paid_amount'),
                'ONLINE' => $transactions->where('payment_method', 'ONLINE')->sum('paid_amount'),
                'QR' => $transactions->where('payment_method', 'QR')->sum('paid_amount'),
            ];

            // Transaction type breakdown
            $typeBreakdown = [
                'OPD' => $transactions->where('transaction_type', 'OPD')->sum('paid_amount'),
                'LAB' => $transactions->where('transaction_type', 'LAB')->sum('paid_amount'),
                'PHARMACY' => $transactions->where('transaction_type', 'PHARMACY')->sum('paid_amount'),
                'SERVICE' => $transactions->where('transaction_type', 'SERVICE')->sum('paid_amount'),
            ];

            // Daily breakdown for charts
            $dailyBreakdown = $transactions->groupBy(function($item) {
                return Carbon::parse($item->transaction_date)->format('Y-m-d');
            })->map(function($dayTransactions) {
                return [
                    'count' => $dayTransactions->count(),
                    'total' => $dayTransactions->sum('paid_amount'),
                ];
            });

            // Top selling products (from service_details)
            $productSales = [];
            foreach ($transactions as $transaction) {
                $details = is_string($transaction->service_details) 
                    ? json_decode($transaction->service_details, true) 
                    : $transaction->service_details;
                
                if (is_array($details)) {
                    foreach ($details as $item) {
                        $productName = $item['service'] ?? 'Unknown';
                        if (!isset($productSales[$productName])) {
                            $productSales[$productName] = [
                                'name' => $productName,
                                'quantity' => 0,
                                'revenue' => 0,
                            ];
                        }
                        $productSales[$productName]['quantity'] += $item['quantity'] ?? 1;
                        $productSales[$productName]['revenue'] += $item['amount'] ?? 0;
                    }
                }
            }
            
            // Sort by revenue and take top 10
            usort($productSales, fn($a, $b) => $b['revenue'] <=> $a['revenue']);
            $topProducts = array_slice($productSales, 0, 10);

            return response()->json([
                'status' => 200,
                'data' => [
                    'report_type' => $reportType,
                    'period' => [
                        'start' => $startDate->format('Y-m-d'),
                        'end' => $endDate->format('Y-m-d'),
                    ],
                    'summary' => [
                        'total_sales' => $totalSales,
                        'total_transactions' => $totalTransactions,
                        'average_transaction' => $totalTransactions > 0 ? round($totalSales / $totalTransactions, 2) : 0,
                    ],
                    'payment_breakdown' => $paymentBreakdown,
                    'type_breakdown' => $typeBreakdown,
                    'daily_breakdown' => $dailyBreakdown,
                    'top_products' => $topProducts,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Sales report error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to generate sales report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get daily sales trend data for charts
     */
    public function getDailySalesTrend(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $days = $request->input('days', 30); // Last 30 days by default
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');

            if ($dateFrom && $dateTo) {
                $startDate = Carbon::parse($dateFrom)->startOfDay();
                $endDate = Carbon::parse($dateTo)->endOfDay();
            } else {
                $endDate = Carbon::today()->endOfDay();
                $startDate = Carbon::today()->subDays($days - 1)->startOfDay();
            }

            // Get transactions grouped by date
            $transactions = BillingTransaction::forBranch($branchId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->orderBy('transaction_date', 'asc')
                ->get();

            // Generate daily data for chart (fill in missing days with zeros)
            $dailyData = [];
            $current = $startDate->copy();
            while ($current->lte($endDate)) {
                $dateStr = $current->format('Y-m-d');
                $dayTransactions = $transactions->filter(function($t) use ($dateStr) {
                    return Carbon::parse($t->transaction_date)->format('Y-m-d') === $dateStr;
                });
                
                $dailyData[] = [
                    'date' => $dateStr,
                    'display_date' => $current->format('M d'),
                    'total_sales' => round($dayTransactions->sum('paid_amount'), 2),
                    'transactions' => $dayTransactions->count(),
                    'cash' => round($dayTransactions->where('payment_method', 'CASH')->sum('paid_amount'), 2),
                    'card' => round($dayTransactions->where('payment_method', 'CARD')->sum('paid_amount'), 2),
                    'online' => round($dayTransactions->where('payment_method', 'ONLINE')->sum('paid_amount'), 2),
                    'qr' => round($dayTransactions->where('payment_method', 'QR')->sum('paid_amount'), 2),
                ];
                $current->addDay();
            }

            // Get EOD history with details
            $eodHistory = DailyCashSummary::forBranch($branchId)
                ->forCashier($user->id)
                ->whereBetween('summary_date', [$startDate, $endDate])
                ->orderBy('summary_date', 'desc')
                ->get()
                ->map(function($eod) {
                    return [
                        'id' => $eod->id,
                        'date' => Carbon::parse($eod->summary_date)->format('Y-m-d'),
                        'display_date' => Carbon::parse($eod->summary_date)->format('M d, Y'),
                        'total_sales' => round($eod->total_sales, 2),
                        'total_transactions' => $eod->total_transactions,
                        'cash_total' => round($eod->cash_total, 2),
                        'card_total' => round($eod->card_total, 2),
                        'online_total' => round($eod->online_total, 2),
                        'qr_total' => round($eod->qr_total, 2),
                        'cash_in_total' => round($eod->cash_in_total, 2),
                        'cash_out_total' => round($eod->cash_out_total, 2),
                        'expected_balance' => round($eod->expected_cash_balance, 2),
                        'actual_balance' => round($eod->actual_cash_counted ?? 0, 2),
                        'variance' => round($eod->cash_variance ?? 0, 2),
                        'status' => $eod->eod_status,
                        'submitted_at' => $eod->submitted_at ? Carbon::parse($eod->submitted_at)->format('Y-m-d H:i:s') : null,
                        'approved_at' => $eod->approved_at ? Carbon::parse($eod->approved_at)->format('Y-m-d H:i:s') : null,
                    ];
                });

            // Calculate summary stats
            $totalSales = $transactions->sum('paid_amount');
            $totalTransactions = $transactions->count();
            $avgDaily = count($dailyData) > 0 ? $totalSales / count($dailyData) : 0;

            // Payment method totals
            $paymentTotals = [
                'cash' => round($transactions->where('payment_method', 'CASH')->sum('paid_amount'), 2),
                'card' => round($transactions->where('payment_method', 'CARD')->sum('paid_amount'), 2),
                'online' => round($transactions->where('payment_method', 'ONLINE')->sum('paid_amount'), 2),
                'qr' => round($transactions->where('payment_method', 'QR')->sum('paid_amount'), 2),
            ];

            // Monthly breakdown for longer periods
            $monthlyData = [];
            if (count($dailyData) > 31) {
                $monthlyGrouped = $transactions->groupBy(function($t) {
                    return Carbon::parse($t->transaction_date)->format('Y-m');
                });
                foreach ($monthlyGrouped as $month => $monthTransactions) {
                    $monthlyData[] = [
                        'month' => $month,
                        'display_month' => Carbon::parse($month . '-01')->format('M Y'),
                        'total_sales' => round($monthTransactions->sum('paid_amount'), 2),
                        'transactions' => $monthTransactions->count(),
                    ];
                }
            }

            return response()->json([
                'status' => 200,
                'data' => [
                    'period' => [
                        'start' => $startDate->format('Y-m-d'),
                        'end' => $endDate->format('Y-m-d'),
                        'days' => $startDate->diffInDays($endDate) + 1,
                    ],
                    'summary' => [
                        'total_sales' => round($totalSales, 2),
                        'total_transactions' => $totalTransactions,
                        'average_daily_sales' => round($avgDaily, 2),
                        'average_transaction' => $totalTransactions > 0 ? round($totalSales / $totalTransactions, 2) : 0,
                    ],
                    'payment_totals' => $paymentTotals,
                    'daily_data' => $dailyData,
                    'monthly_data' => $monthlyData,
                    'eod_history' => $eodHistory,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Daily sales trend error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch daily sales trend',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get cashier profile
     */
    public function getProfile()
    {
        try {
            $user = Auth::user();
            
            return response()->json([
                'status' => 200,
                'data' => [
                    'update_user_details' => [
                        'id' => $user->id,
                        'first_name' => $user->first_name ?? explode(' ', $user->name ?? 'User')[0],
                        'last_name' => $user->last_name ?? (count(explode(' ', $user->name ?? '')) > 1 ? explode(' ', $user->name)[1] : ''),
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'address' => $user->address ?? '',
                        'profile_picture' => $user->profile_picture ?? '',
                        'role_as' => $user->role_as ?? 3,
                        'is_active' => $user->is_active ?? true,
                        'gender' => $user->gender ?? '',
                        'branch_id' => $user->branch_id,
                    ]
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching cashier profile: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch profile: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update cashier profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'first_name' => 'nullable|string|max:100',
                'last_name' => 'nullable|string|max:100',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $data = $validator->validated();
            
            // Update name if first_name or last_name provided
            if (isset($data['first_name']) || isset($data['last_name'])) {
                $firstName = $data['first_name'] ?? $user->first_name ?? '';
                $lastName = $data['last_name'] ?? $user->last_name ?? '';
                $data['name'] = trim("$firstName $lastName");
            }
            
            $user->update($data);

            return response()->json([
                'status' => 200,
                'message' => 'Profile updated successfully',
                'data' => $user,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating cashier profile: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update profile: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'password' => 'required|string|min:6|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();

            if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'status' => 401,
                    'message' => 'Current password is incorrect',
                ], 401);
            }

            $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
            $user->save();

            return response()->json([
                'status' => 200,
                'message' => 'Password changed successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error changing password: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to change password: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload profile picture
     */
    public function uploadProfilePicture(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();

            if ($request->hasFile('profile_picture')) {
                $file = $request->file('profile_picture');
                $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/profiles'), $filename);
                
                // Delete old profile picture if exists
                if ($user->profile_picture && file_exists(public_path($user->profile_picture))) {
                    @unlink(public_path($user->profile_picture));
                }
                
                $user->profile_picture = 'uploads/profiles/' . $filename;
                $user->save();

                return response()->json([
                    'status' => 200,
                    'message' => 'Profile picture updated successfully',
                    'profile_picture' => $user->profile_picture,
                ]);
            }

            return response()->json([
                'status' => 400,
                'message' => 'No file uploaded',
            ], 400);
        } catch (\Exception $e) {
            Log::error('Error uploading profile picture: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to upload profile picture: ' . $e->getMessage(),
            ], 500);
        }
    }
}
