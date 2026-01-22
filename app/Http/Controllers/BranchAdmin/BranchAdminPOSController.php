<?php

namespace App\Http\Controllers\BranchAdmin;

use App\Http\Controllers\Controller;
use App\Models\Cashier\BillingTransaction;
use App\Models\Cashier\CashEntry;
use App\Models\Cashier\DailyCashSummary;
use App\Models\AllUsers\User;
use App\Models\Notification;
use App\Services\POSAuditService;
use App\Traits\EnforcesBranchIsolation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BranchAdminPOSController extends Controller
{
    use EnforcesBranchIsolation;
    /**
     * Get Branch Admin POS Dashboard Stats
     * Shows aggregated data for the entire branch
     */
    public function getDashboardStats(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();
            $yesterday = Carbon::yesterday();

            // Today's branch-wide transactions
            $todayTransactions = BillingTransaction::forBranch($branchId)
                ->forDate($today)
                ->get();

            $todaySales = $todayTransactions->sum('paid_amount');
            $transactionCount = $todayTransactions->count();

            // Yesterday's sales for comparison
            $yesterdayTransactions = BillingTransaction::forBranch($branchId)
                ->forDate($yesterday)
                ->get();
            $yesterdaySales = $yesterdayTransactions->sum('paid_amount');

            // Payment mode breakdown
            $paymentBreakdown = [
                'cash' => $todayTransactions->where('payment_method', 'CASH')->sum('paid_amount'),
                'card' => $todayTransactions->where('payment_method', 'CARD')->sum('paid_amount'),
                'online' => $todayTransactions->where('payment_method', 'ONLINE')->sum('paid_amount'),
                'qr' => $todayTransactions->where('payment_method', 'QR')->sum('paid_amount'),
            ];

            // Cash entries for the branch
            $todayCashIn = CashEntry::forBranch($branchId)
                ->forDate($today)
                ->cashIn()
                ->sum('amount');

            $todayCashOut = CashEntry::forBranch($branchId)
                ->forDate($today)
                ->cashOut()
                ->sum('amount');

            // Get cashier performance for this branch
            $cashierStats = $this->getCashierPerformance($branchId, $today);

            // Calculate sales change percentage
            $salesChangePercentage = $yesterdaySales > 0 
                ? (($todaySales - $yesterdaySales) / $yesterdaySales) * 100 
                : ($todaySales > 0 ? 100 : 0);

            // Branch info
            $branch = $user->branch;

            return response()->json([
                'status' => 200,
                'data' => [
                    'branch' => [
                        'id' => $branch->id ?? null,
                        'name' => $branch->center_name ?? 'Unknown Branch',
                        'type' => $branch->center_type ?? null,
                    ],
                    'today_stats' => [
                        'date' => $today->format('Y-m-d'),
                        'total_sales' => (float) $todaySales,
                        'transaction_count' => $transactionCount,
                        'cash_in' => (float) $todayCashIn,
                        'cash_out' => (float) $todayCashOut,
                        'net_cash' => (float) ($todayCashIn - $todayCashOut + $paymentBreakdown['cash']),
                    ],
                    'payment_breakdown' => $paymentBreakdown,
                    'cashier_stats' => $cashierStats,
                    'comparison' => [
                        'yesterday_sales' => (float) $yesterdaySales,
                        'sales_change_percentage' => round($salesChangePercentage, 2),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Branch Admin dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get Branch Analytics
     */
    public function getAnalytics(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $range = $request->get('range', '7days');

            // Determine date range
            switch ($range) {
                case '30days':
                    $startDate = Carbon::now()->subDays(30);
                    break;
                case 'thisMonth':
                    $startDate = Carbon::now()->startOfMonth();
                    break;
                default:
                    $startDate = Carbon::now()->subDays(7);
            }
            $endDate = Carbon::now();

            // Get transactions for the period
            $transactions = BillingTransaction::forBranch($branchId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $totalSales = $transactions->sum('paid_amount');
            $transactionCount = $transactions->count();
            $avgTransaction = $transactionCount > 0 ? $totalSales / $transactionCount : 0;

            // Cash entries
            $cashIn = CashEntry::forBranch($branchId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->cashIn()
                ->sum('amount');

            $cashOut = CashEntry::forBranch($branchId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->cashOut()
                ->sum('amount');

            // Daily sales breakdown
            $dailySales = BillingTransaction::forBranch($branchId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('DATE(created_at) as date, SUM(paid_amount) as sales, COUNT(*) as transactions')
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'sales' => (float) $item->sales,
                        'transactions' => (int) $item->transactions,
                    ];
                });

            // Payment trends
            $paymentTrends = [
                'cash' => $transactions->where('payment_method', 'CASH')->sum('paid_amount'),
                'card' => $transactions->where('payment_method', 'CARD')->sum('paid_amount'),
                'online' => $transactions->where('payment_method', 'ONLINE')->sum('paid_amount'),
                'qr' => $transactions->where('payment_method', 'QR')->sum('paid_amount'),
            ];

            // Top cashiers
            $topCashiers = BillingTransaction::forBranch($branchId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('cashier_id, SUM(paid_amount) as total_sales, COUNT(*) as transaction_count')
                ->groupBy('cashier_id')
                ->orderByDesc('total_sales')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    $cashier = User::find($item->cashier_id);
                    return [
                        'id' => $item->cashier_id,
                        'name' => $cashier ? $cashier->name : 'Unknown',
                        'total_sales' => (float) $item->total_sales,
                        'transaction_count' => (int) $item->transaction_count,
                    ];
                });

            // Top selling products (item-wise sales from service_details)
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
            usort($productSales, fn($a, $b) => $b['revenue'] <=> $a['revenue']);
            $topProducts = array_slice($productSales, 0, 10);

            $branch = $user->branch;

            return response()->json([
                'status' => 200,
                'data' => [
                    'branch' => [
                        'id' => $branch->id ?? null,
                        'name' => $branch->center_name ?? 'Unknown Branch',
                    ],
                    'summary' => [
                        'total_sales' => (float) $totalSales,
                        'total_transactions' => $transactionCount,
                        'average_transaction' => (float) round($avgTransaction, 2),
                        'total_cash_in' => (float) $cashIn,
                        'total_cash_out' => (float) $cashOut,
                    ],
                    'daily_sales' => $dailySales,
                    'payment_trends' => $paymentTrends,
                    'top_cashiers' => $topCashiers,
                    'top_products' => $topProducts,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Branch Admin analytics error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch analytics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get cashier performance for a branch
     */
    private function getCashierPerformance($branchId, $date)
    {
        // Get all cashiers for this branch
        $cashiers = User::where('branch_id', $branchId)
            ->where('role_as', 6) // Cashier role
            ->get();

        $cashierStats = [];

        foreach ($cashiers as $cashier) {
            $transactions = BillingTransaction::forBranch($branchId)
                ->forCashier($cashier->id)
                ->forDate($date)
                ->get();

            $eodSummary = DailyCashSummary::forBranch($branchId)
                ->forCashier($cashier->id)
                ->forDate($date)
                ->first();

            $cashierStats[] = [
                'id' => $cashier->id,
                'name' => $cashier->name,
                'total_sales' => (float) $transactions->sum('paid_amount'),
                'transaction_count' => $transactions->count(),
                'eod_status' => $eodSummary ? $eodSummary->eod_status : 'OPEN',
            ];
        }

        // Sort by total sales descending
        usort($cashierStats, function ($a, $b) {
            return $b['total_sales'] <=> $a['total_sales'];
        });

        return $cashierStats;
    }

    /**
     * Get all branch transactions (for Branch Admin to view all cashier transactions)
     */
    public function getBranchTransactions(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $query = BillingTransaction::forBranch($branchId)
                ->with(['cashier:id,name', 'patient:id,name,phone'])
                ->orderBy('created_at', 'desc');

            // Date filter
            if ($request->has('date')) {
                $query->forDate(Carbon::parse($request->date));
            }

            // Cashier filter
            if ($request->has('cashier_id')) {
                $query->forCashier($request->cashier_id);
            }

            // Payment method filter
            if ($request->has('payment_method')) {
                $query->where('payment_method', $request->payment_method);
            }

            $transactions = $query->paginate($request->get('per_page', 20));

            return response()->json([
                'status' => 200,
                'data' => $transactions,
            ]);
        } catch (\Exception $e) {
            Log::error('Branch transactions error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch transactions',
            ], 500);
        }
    }

    /**
     * Create a transaction (Branch Admin can perform sales for their branch)
     */
    public function createTransaction(Request $request)
    {
        try {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
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

            // Validate all items have valid product_id and prices match database
            // Branch Admin also cannot modify prices - prices must come from product database
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
                
                if (!$product) {
                    return response()->json([
                        'status' => 422,
                        'message' => 'Invalid product ID: ' . $item['product_id'],
                    ], 422);
                }
                
                $quantity = $item['quantity'] ?? 1;
                $expectedAmount = $product->selling_price * $quantity;
                $submittedAmount = floatval($item['amount']);
                
                // Allow small tolerance for floating point differences
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
                'remarks' => $request->remarks . ' [Created by Branch Admin]',
                'patient_name' => $request->patient_name,
                'patient_phone' => $request->patient_phone,
                'transaction_date' => $today,
                'is_locked' => false,
            ]);

            // Update stock levels for products and check for low stock
            $lowStockItems = [];
            foreach ($request->service_details as $item) {
                if (!empty($item['product_id'])) {
                    $quantity = $item['quantity'] ?? 1;
                    
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
                $this->createLowStockNotifications($lowStockItems, $branchId);
            }

            DB::commit();

            // Audit log: Transaction created by branch admin
            POSAuditService::logTransaction($transaction->id, [
                'invoice_number' => $transaction->invoice_number,
                'total_amount' => $transaction->total_amount,
                'payment_method' => $transaction->payment_method,
                'patient_name' => $transaction->patient_name,
                'items_count' => count($request->items ?? []),
                'created_by_role' => 'branch_admin',
            ], $branchId);

            return response()->json([
                'status' => 201,
                'message' => 'Transaction created successfully',
                'data' => $transaction,
                'low_stock_warning' => !empty($lowStockItems) ? $lowStockItems : null,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Branch Admin create transaction error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create transaction',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get branch cashiers for management
     */
    public function getBranchCashiers(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();

            $cashiers = User::where('branch_id', $branchId)
                ->where('role_as', 6) // Cashier role
                ->get()
                ->map(function ($cashier) use ($today, $branchId) {
                    $todayTransactions = BillingTransaction::forBranch($branchId)
                        ->forCashier($cashier->id)
                        ->forDate($today)
                        ->get();

                    $eodSummary = DailyCashSummary::forBranch($branchId)
                        ->forCashier($cashier->id)
                        ->forDate($today)
                        ->first();

                    // Get this week's stats
                    $weekStart = Carbon::now()->startOfWeek();
                    $weekTransactions = BillingTransaction::forBranch($branchId)
                        ->forCashier($cashier->id)
                        ->where('created_at', '>=', $weekStart)
                        ->get();

                    return [
                        'id' => $cashier->id,
                        'name' => $cashier->name,
                        'email' => $cashier->email,
                        'phone' => $cashier->phone ?? 'N/A',
                        'today_sales' => (float) $todayTransactions->sum('paid_amount'),
                        'today_transactions' => $todayTransactions->count(),
                        'week_sales' => (float) $weekTransactions->sum('paid_amount'),
                        'week_transactions' => $weekTransactions->count(),
                        'eod_status' => $eodSummary ? $eodSummary->eod_status : 'OPEN',
                        'is_active' => $cashier->is_active ?? true,
                        'last_login' => $cashier->last_login_at ?? null,
                    ];
                });

            return response()->json([
                'status' => 200,
                'data' => $cashiers,
            ]);
        } catch (\Exception $e) {
            Log::error('Get branch cashiers error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch cashiers',
            ], 500);
        }
    }

    /**
     * Get EOD status for all cashiers in the branch
     */
    public function getCashiersEODStatus(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->get('date', Carbon::today()->format('Y-m-d'));
            $targetDate = Carbon::parse($date);

            $cashiers = User::where('branch_id', $branchId)
                ->where('role_as', 6)
                ->get()
                ->map(function ($cashier) use ($branchId, $targetDate) {
                    $eodSummary = DailyCashSummary::forBranch($branchId)
                        ->forCashier($cashier->id)
                        ->forDate($targetDate)
                        ->first();

                    $transactions = BillingTransaction::forBranch($branchId)
                        ->forCashier($cashier->id)
                        ->forDate($targetDate)
                        ->get();

                    return [
                        'cashier_id' => $cashier->id,
                        'cashier_name' => $cashier->name,
                        'total_sales' => (float) $transactions->sum('paid_amount'),
                        'transaction_count' => $transactions->count(),
                        'eod_status' => $eodSummary ? $eodSummary->eod_status : 'OPEN',
                        'submitted_at' => $eodSummary ? $eodSummary->submitted_at : null,
                        'approved_at' => $eodSummary ? $eodSummary->approved_at : null,
                    ];
                });

            return response()->json([
                'status' => 200,
                'data' => [
                    'date' => $date,
                    'cashiers' => $cashiers,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get cashiers EOD status error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch EOD status',
            ], 500);
        }
    }

    /**
     * Get products for the branch
     */
    public function getBranchProducts(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $search = $request->get('search', '');

            $query = DB::table('products')
                ->join('products_stock', 'products.id', '=', 'products_stock.product_id')
                ->where('products_stock.branch_id', $branchId)
                ->select(
                    'products.id',
                    'products.item_name',
                    'products.item_code',
                    'products_stock.unit_selling_price as selling_price',
                    'products_stock.current_stock as stock'
                );

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('products.item_name', 'like', "%{$search}%")
                      ->orWhere('products.item_code', 'like', "%{$search}%");
                });
            }

            $products = $query->orderBy('products.item_name')->limit(50)->get();

            return response()->json([
                'status' => 200,
                'data' => $products,
            ]);
        } catch (\Exception $e) {
            Log::error('Get branch products error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch products',
            ], 500);
        }
    }

    /**
     * Generate invoice number
     */
    private function generateInvoiceNumber($branchId)
    {
        $branch = \App\Models\Branch::find($branchId);
        $prefix = $branch ? strtoupper(substr($branch->center_name, 0, 3)) : 'INV';
        $date = Carbon::today()->format('Ymd');
        $count = BillingTransaction::where('branch_id', $branchId)
            ->whereDate('created_at', Carbon::today())
            ->count() + 1;
        return $prefix . '-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate receipt number
     */
    private function generateReceiptNumber($branchId)
    {
        $branch = \App\Models\Branch::find($branchId);
        $prefix = $branch ? strtoupper(substr($branch->center_name, 0, 2)) : 'RC';
        $count = BillingTransaction::where('branch_id', $branchId)->count() + 1;
        return $prefix . '-' . str_pad($count, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Create low stock notifications for relevant users
     */
    private function createLowStockNotifications(array $lowStockItems, $branchId): void
    {
        try {
            foreach ($lowStockItems as $item) {
                $title = 'Low Stock Alert';
                $message = "Product '{$item['name']}' (Code: {$item['code']}) is running low. Current stock: {$item['current_stock']} units. Reorder level: {$item['reorder_level']} units.";

                // Notify branch admin, pharmacists, and super admin
                $usersToNotify = User::where(function ($query) use ($branchId) {
                        $query->where('branch_id', $branchId)
                              ->whereIn('role', ['branch_admin', 'pharmacist']);
                    })
                    ->orWhere('role', 'super_admin')
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
     * Get inventory list for the branch (for POS product selection)
     */
    public function getInventoryList(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $products = DB::table('products')
                ->join('products_stock', 'products.id', '=', 'products_stock.product_id')
                ->where('products_stock.branch_id', $branchId)
                ->where('products_stock.current_stock', '>', 0)
                ->select(
                    'products.id',
                    'products.item_name',
                    'products.item_code',
                    'products.category',
                    'products_stock.unit_selling_price as selling_price',
                    'products_stock.current_stock as stock'
                )
                ->orderBy('products.item_name')
                ->get();

            return response()->json($products);
        } catch (\Exception $e) {
            Log::error('Branch Admin get inventory list error: ' . $e->getMessage());
            return response()->json([], 500);
        }
    }

    /**
     * Search patients for the branch
     */
    public function searchPatients(Request $request)
    {
        try {
            $search = $request->get('q', '');
            
            if (strlen($search) < 2) {
                return response()->json([]);
            }

            $patients = DB::table('patients')
                ->where(function ($query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('phone', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                })
                ->select('id', 'first_name', 'last_name', 'phone', 'email')
                ->limit(10)
                ->get();

            return response()->json($patients);
        } catch (\Exception $e) {
            Log::error('Branch Admin search patients error: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    /**
     * Search products for the branch
     */
    public function searchProducts(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $search = $request->get('q', '');
            
            if (strlen($search) < 2) {
                return response()->json([]);
            }

            $products = DB::table('products')
                ->join('products_stock', 'products.id', '=', 'products_stock.product_id')
                ->where('products_stock.branch_id', $branchId)
                ->where('products_stock.current_stock', '>', 0)
                ->where(function ($query) use ($search) {
                    $query->where('products.item_name', 'like', "%{$search}%")
                          ->orWhere('products.item_code', 'like', "%{$search}%");
                })
                ->select(
                    'products.id',
                    'products.item_name',
                    'products.item_code',
                    'products_stock.unit_selling_price as selling_price',
                    'products_stock.current_stock as stock'
                )
                ->limit(10)
                ->get();

            return response()->json($products);
        } catch (\Exception $e) {
            Log::error('Branch Admin search products error: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    /**
     * Get cash entries for the branch
     */
    public function getCashEntries(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();

            $cashEntries = CashEntry::forBranch($branchId)
                ->forDate($today)
                ->with('user:id,name')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $cashEntries,
            ]);
        } catch (\Exception $e) {
            Log::error('Branch Admin get cash entries error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch cash entries',
            ], 500);
        }
    }

    /**
     * Create a cash entry for the branch
     */
    public function createCashEntry(Request $request)
    {
        try {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'entry_type' => 'required|in:CASH_IN,CASH_OUT',
                'category' => 'required|string',
                'amount' => 'required|numeric|min:0.01',
                'description' => 'required|string|max:500',
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

            $cashEntry = CashEntry::create([
                'branch_id' => $branchId,
                'user_id' => $user->id,
                'cashier_id' => $user->id,
                'entry_type' => $request->entry_type,
                'category' => $request->category,
                'amount' => $request->amount,
                'description' => $request->description,
                'reference_number' => $request->reference_number,
                'remarks' => $request->remarks . ' [Created by Branch Admin]',
                'entry_date' => $today,
                'approval_status' => 'approved', // Branch Admin entries are auto-approved
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            return response()->json([
                'status' => 201,
                'message' => 'Cash entry created successfully',
                'data' => $cashEntry,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Branch Admin create cash entry error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create cash entry',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get cash summary for the branch
     */
    public function getCashSummary(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();

            $transactions = BillingTransaction::forBranch($branchId)
                ->forDate($today)
                ->get();

            $cashIn = CashEntry::forBranch($branchId)
                ->forDate($today)
                ->cashIn()
                ->sum('amount');

            $cashOut = CashEntry::forBranch($branchId)
                ->forDate($today)
                ->cashOut()
                ->sum('amount');

            $summary = [
                'date' => $today->format('Y-m-d'),
                'total_sales' => $transactions->sum('paid_amount'),
                'cash_sales' => $transactions->where('payment_method', 'CASH')->sum('paid_amount'),
                'card_sales' => $transactions->where('payment_method', 'CARD')->sum('paid_amount'),
                'online_sales' => $transactions->where('payment_method', 'ONLINE')->sum('paid_amount'),
                'qr_sales' => $transactions->where('payment_method', 'QR')->sum('paid_amount'),
                'transaction_count' => $transactions->count(),
                'cash_in' => (float) $cashIn,
                'cash_out' => (float) $cashOut,
                'opening_balance' => 0, // Can be set from previous day closing
                'expected_balance' => (float) ($transactions->where('payment_method', 'CASH')->sum('paid_amount') + $cashIn - $cashOut),
            ];

            return response()->json([
                'status' => 200,
                'data' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Branch Admin get cash summary error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch cash summary',
            ], 500);
        }
    }

    /**
     * Get EOD summary for the branch (for monitoring cashier EODs)
     */
    public function getEODSummary(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $today = Carbon::today();

            // Check if EOD already exists for today
            $existingEOD = DailyCashSummary::where('branch_id', $branchId)
                ->whereDate('summary_date', $today)
                ->first();

            if ($existingEOD) {
                return response()->json([
                    'status' => 200,
                    'data' => $existingEOD,
                ]);
            }

            // Get all transactions for the branch today
            $transactions = BillingTransaction::forBranch($branchId)
                ->forDate($today)
                ->get();

            // Cash entries
            $cashIn = CashEntry::forBranch($branchId)
                ->forDate($today)
                ->cashIn()
                ->sum('amount');

            $cashOut = CashEntry::forBranch($branchId)
                ->forDate($today)
                ->cashOut()
                ->sum('amount');

            // Calculate expected balance
            $cashSales = $transactions->where('payment_method', 'CASH')->sum('paid_amount');
            $openingBalance = 0; // Could be fetched from previous day's closing

            $summary = [
                'id' => null,
                'summary_date' => $today->format('Y-m-d'),
                'branch_id' => $branchId,
                'total_sales' => (float) $transactions->sum('paid_amount'),
                'total_transactions' => $transactions->count(),
                'cash_total' => (float) $cashSales,
                'cash_count' => $transactions->where('payment_method', 'CASH')->count(),
                'card_total' => (float) $transactions->where('payment_method', 'CARD')->sum('paid_amount'),
                'card_count' => $transactions->where('payment_method', 'CARD')->count(),
                'online_total' => (float) $transactions->where('payment_method', 'ONLINE')->sum('paid_amount'),
                'online_count' => $transactions->where('payment_method', 'ONLINE')->count(),
                'qr_total' => (float) $transactions->where('payment_method', 'QR')->sum('paid_amount'),
                'qr_count' => $transactions->where('payment_method', 'QR')->count(),
                'cash_in_total' => (float) $cashIn,
                'cash_out_total' => (float) $cashOut,
                'opening_balance' => (float) $openingBalance,
                'expected_cash_balance' => (float) ($openingBalance + $cashSales + $cashIn - $cashOut),
                'actual_cash_counted' => null,
                'cash_variance' => 0,
                'variance_remarks' => null,
                'eod_status' => 'OPEN',
                'submitted_at' => null,
                'is_eod_locked' => false,
            ];

            return response()->json([
                'status' => 200,
                'data' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Branch Admin get EOD summary error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch EOD summary',
            ], 500);
        }
    }

    /**
     * Submit EOD for Branch Admin
     */
    public function submitEOD(Request $request)
    {
        try {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'actual_cash_counted' => 'required|numeric|min:0',
                'variance_remarks' => 'nullable|string|max:500',
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

            // Get all transactions for the branch today
            $transactions = BillingTransaction::forBranch($branchId)
                ->forDate($today)
                ->get();

            // Cash entries
            $cashIn = CashEntry::forBranch($branchId)
                ->forDate($today)
                ->cashIn()
                ->sum('amount');

            $cashOut = CashEntry::forBranch($branchId)
                ->forDate($today)
                ->cashOut()
                ->sum('amount');

            // Calculate totals
            $cashSales = $transactions->where('payment_method', 'CASH')->sum('paid_amount');
            $openingBalance = 0;
            $expectedBalance = $openingBalance + $cashSales + $cashIn - $cashOut;
            $actualCashCounted = $request->actual_cash_counted;
            $variance = $actualCashCounted - $expectedBalance;

            // Create or update the EOD summary
            $eodSummary = DailyCashSummary::updateOrCreate(
                [
                    'branch_id' => $branchId,
                    'summary_date' => $today,
                ],
                [
                    'user_id' => $user->id,
                    'cashier_id' => $user->id,
                    'total_sales' => $transactions->sum('paid_amount'),
                    'total_transactions' => $transactions->count(),
                    'cash_total' => $cashSales,
                    'cash_count' => $transactions->where('payment_method', 'CASH')->count(),
                    'card_total' => $transactions->where('payment_method', 'CARD')->sum('paid_amount'),
                    'card_count' => $transactions->where('payment_method', 'CARD')->count(),
                    'online_total' => $transactions->where('payment_method', 'ONLINE')->sum('paid_amount'),
                    'online_count' => $transactions->where('payment_method', 'ONLINE')->count(),
                    'qr_total' => $transactions->where('payment_method', 'QR')->sum('paid_amount'),
                    'qr_count' => $transactions->where('payment_method', 'QR')->count(),
                    'cash_in_total' => $cashIn,
                    'cash_out_total' => $cashOut,
                    'opening_balance' => $openingBalance,
                    'expected_cash_balance' => $expectedBalance,
                    'actual_cash_counted' => $actualCashCounted,
                    'cash_variance' => $variance,
                    'variance_remarks' => $request->variance_remarks . ' [Submitted by Branch Admin]',
                    'eod_status' => 'CLOSED',
                    'submitted_at' => now(),
                    'approved_at' => now(),
                    'approved_by' => $user->id,
                ]
            );

            return response()->json([
                'status' => 200,
                'message' => 'EOD submitted successfully',
                'data' => $eodSummary,
            ]);
        } catch (\Exception $e) {
            Log::error('Branch Admin submit EOD error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to submit EOD: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get daily sales trend for reports
     */
    public function getDailySalesTrend(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            
            // Get date range from request or default to last 30 days
            $dateFrom = $request->get('date_from', Carbon::now()->subDays(30)->format('Y-m-d'));
            $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
            
            $startDate = Carbon::parse($dateFrom)->startOfDay();
            $endDate = Carbon::parse($dateTo)->endOfDay();
            $daysDiff = $startDate->diffInDays($endDate) + 1;

            // Get all transactions in date range
            $transactions = BillingTransaction::forBranch($branchId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            // Calculate totals
            $totalSales = (float) $transactions->sum('paid_amount');
            $totalTransactions = $transactions->count();
            $cashTotal = (float) $transactions->where('payment_method', 'CASH')->sum('paid_amount');
            $cardTotal = (float) $transactions->where('payment_method', 'CARD')->sum('paid_amount');
            $onlineTotal = (float) $transactions->where('payment_method', 'ONLINE')->sum('paid_amount');
            $qrTotal = (float) $transactions->where('payment_method', 'QR')->sum('paid_amount');

            // Daily data - use DATE() which works in both MySQL and SQLite
            $dailyData = BillingTransaction::forBranch($branchId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('DATE(created_at) as date, 
                    SUM(paid_amount) as total_sales, 
                    COUNT(*) as transactions,
                    SUM(CASE WHEN payment_method = "CASH" THEN paid_amount ELSE 0 END) as cash,
                    SUM(CASE WHEN payment_method = "CARD" THEN paid_amount ELSE 0 END) as card,
                    SUM(CASE WHEN payment_method = "ONLINE" THEN paid_amount ELSE 0 END) as online,
                    SUM(CASE WHEN payment_method = "QR" THEN paid_amount ELSE 0 END) as qr')
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'display_date' => Carbon::parse($item->date)->format('M d, Y'),
                        'total_sales' => (float) $item->total_sales,
                        'transactions' => (int) $item->transactions,
                        'cash' => (float) $item->cash,
                        'card' => (float) $item->card,
                        'online' => (float) $item->online,
                        'qr' => (float) $item->qr,
                    ];
                });

            // Monthly data - use strftime for SQLite compatibility
            // Group transactions by month in PHP instead of SQL for cross-database compatibility
            $monthlyData = collect($transactions)
                ->groupBy(function ($item) {
                    return Carbon::parse($item->created_at)->format('Y-m');
                })
                ->map(function ($items, $month) {
                    return [
                        'month' => $month,
                        'display_month' => Carbon::parse($month . '-01')->format('F Y'),
                        'total_sales' => (float) $items->sum('paid_amount'),
                        'transactions' => (int) $items->count(),
                    ];
                })
                ->values()
                ->sortBy('month')
                ->values();

            // EOD history
            $eodHistory = DailyCashSummary::where('branch_id', $branchId)
                ->whereBetween('summary_date', [$startDate, $endDate])
                ->orderBy('summary_date', 'desc')
                ->get()
                ->map(function ($eod) {
                    return [
                        'id' => $eod->id,
                        'date' => $eod->summary_date,
                        'display_date' => Carbon::parse($eod->summary_date)->format('M d, Y'),
                        'total_sales' => (float) ($eod->total_sales ?? 0),
                        'total_transactions' => (int) ($eod->total_transactions ?? 0),
                        'cash_total' => (float) ($eod->cash_total ?? 0),
                        'card_total' => (float) ($eod->card_total ?? 0),
                        'online_total' => (float) ($eod->online_total ?? 0),
                        'qr_total' => (float) ($eod->qr_total ?? 0),
                        'cash_in_total' => (float) ($eod->cash_in_total ?? 0),
                        'cash_out_total' => (float) ($eod->cash_out_total ?? 0),
                        'expected_balance' => (float) ($eod->expected_cash_balance ?? 0),
                        'actual_balance' => (float) ($eod->actual_cash_counted ?? 0),
                        'variance' => (float) ($eod->cash_variance ?? 0),
                        'status' => $eod->eod_status ?? 'OPEN',
                        'submitted_at' => $eod->submitted_at,
                        'approved_at' => $eod->approved_at,
                    ];
                });

            $reportData = [
                'period' => [
                    'start' => $dateFrom,
                    'end' => $dateTo,
                    'days' => $daysDiff,
                ],
                'summary' => [
                    'total_sales' => $totalSales,
                    'total_transactions' => $totalTransactions,
                    'average_daily_sales' => $daysDiff > 0 ? round($totalSales / $daysDiff, 2) : 0,
                    'average_transaction' => $totalTransactions > 0 ? round($totalSales / $totalTransactions, 2) : 0,
                ],
                'payment_totals' => [
                    'cash' => $cashTotal,
                    'card' => $cardTotal,
                    'online' => $onlineTotal,
                    'qr' => $qrTotal,
                ],
                'daily_data' => $dailyData,
                'monthly_data' => $monthlyData,
                'eod_history' => $eodHistory,
            ];

            return response()->json([
                'status' => 200,
                'data' => $reportData,
            ]);
        } catch (\Exception $e) {
            Log::error('Branch Admin get daily sales trend error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch daily sales trend',
            ], 500);
        }
    }

    /**
     * Get EOD requests from cashiers for approval
     * Shows all cashier EOD summaries for the selected date
     */
    public function getEODRequests(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $date = $request->get('date', Carbon::today()->format('Y-m-d'));
            $parsedDate = Carbon::parse($date);

            // Get all cashiers in this branch
            $cashiers = User::where('branch_id', $branchId)
                ->where('role_as', 6) // Cashier role
                ->get();

            $eodList = [];
            $pendingCount = 0;
            $approvedCount = 0;
            $rejectedCount = 0;
            $totalSalesToday = 0;

            foreach ($cashiers as $cashier) {
                // Get EOD summary if exists
                $eodSummary = DailyCashSummary::forBranch($branchId)
                    ->forCashier($cashier->id)
                    ->forDate($parsedDate)
                    ->first();

                // Get transactions for this cashier today
                $transactions = BillingTransaction::forBranch($branchId)
                    ->forCashier($cashier->id)
                    ->forDate($parsedDate)
                    ->get();

                $totalSales = $transactions->sum('paid_amount');
                $totalSalesToday += $totalSales;
                $transactionCount = $transactions->count();

                // Payment breakdown
                $cashTotal = $transactions->where('payment_method', 'CASH')->sum('paid_amount');
                $cardTotal = $transactions->where('payment_method', 'CARD')->sum('paid_amount');
                $onlineTotal = $transactions->where('payment_method', 'ONLINE')->sum('paid_amount');
                $qrTotal = $transactions->where('payment_method', 'QR')->sum('paid_amount');

                // Cash entries
                $cashIn = CashEntry::forBranch($branchId)
                    ->where('cashier_id', $cashier->id)
                    ->forDate($parsedDate)
                    ->cashIn()
                    ->sum('amount');

                $cashOut = CashEntry::forBranch($branchId)
                    ->where('cashier_id', $cashier->id)
                    ->forDate($parsedDate)
                    ->cashOut()
                    ->sum('amount');

                $expectedCashBalance = $cashTotal + $cashIn - $cashOut;

                if ($eodSummary) {
                    // Use the existing EOD summary data
                    $status = $eodSummary->eod_status;
                    if (in_array($status, ['PENDING', 'SUBMITTED'])) $pendingCount++;
                    elseif (in_array($status, ['APPROVED', 'CLOSED'])) $approvedCount++;
                    elseif ($status === 'REJECTED') $rejectedCount++;

                    $eodList[] = [
                        'id' => $eodSummary->id,
                        'cashier_id' => $cashier->id,
                        'cashier_name' => $cashier->name,
                        'cashier_email' => $cashier->email,
                        'summary_date' => $eodSummary->summary_date,
                        'total_transactions' => $eodSummary->total_transactions ?? $transactionCount,
                        'total_sales' => (float) ($eodSummary->total_sales ?? $totalSales),
                        'cash_total' => (float) ($eodSummary->cash_total ?? $cashTotal),
                        'card_total' => (float) ($eodSummary->card_total ?? $cardTotal),
                        'online_total' => (float) ($eodSummary->online_total ?? $onlineTotal),
                        'qr_total' => (float) ($eodSummary->qr_total ?? $qrTotal),
                        'cash_in_total' => (float) ($eodSummary->cash_in_total ?? $cashIn),
                        'cash_out_total' => (float) ($eodSummary->cash_out_total ?? $cashOut),
                        'expected_cash_balance' => (float) ($eodSummary->expected_cash_balance ?? $expectedCashBalance),
                        'actual_cash_counted' => (float) ($eodSummary->actual_cash_counted ?? 0),
                        'cash_variance' => (float) ($eodSummary->cash_variance ?? 0),
                        'variance_remarks' => $eodSummary->variance_remarks,
                        'eod_status' => $status,
                        'submitted_at' => $eodSummary->submitted_at,
                        'approved_at' => $eodSummary->approved_at,
                        'approved_by' => $eodSummary->approved_by,
                        'rejection_reason' => $eodSummary->rejection_reason,
                    ];
                } else {
                    // No EOD submitted yet - show as OPEN
                    // Only add if cashier has transactions for this date
                    if ($transactionCount > 0) {
                        $eodList[] = [
                            'id' => null,
                            'cashier_id' => $cashier->id,
                            'cashier_name' => $cashier->name,
                            'cashier_email' => $cashier->email,
                            'summary_date' => $parsedDate->format('Y-m-d'),
                            'total_transactions' => $transactionCount,
                            'total_sales' => (float) $totalSales,
                            'cash_total' => (float) $cashTotal,
                            'card_total' => (float) $cardTotal,
                            'online_total' => (float) $onlineTotal,
                            'qr_total' => (float) $qrTotal,
                            'cash_in_total' => (float) $cashIn,
                            'cash_out_total' => (float) $cashOut,
                            'expected_cash_balance' => (float) $expectedCashBalance,
                            'actual_cash_counted' => 0,
                            'cash_variance' => 0,
                            'variance_remarks' => null,
                            'eod_status' => 'OPEN',
                            'submitted_at' => null,
                            'approved_at' => null,
                            'approved_by' => null,
                            'rejection_reason' => null,
                        ];
                    }
                }
            }

            return response()->json([
                'status' => 200,
                'data' => [
                    'eod_list' => $eodList,
                    'stats' => [
                        'total_cashiers' => $cashiers->count(),
                        'pending_eods' => $pendingCount,
                        'approved_eods' => $approvedCount,
                        'rejected_eods' => $rejectedCount,
                        'total_sales_today' => (float) $totalSalesToday,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Branch Admin get EOD requests error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch EOD requests',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve a cashier's EOD
     */
    public function approveEOD(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $eodSummary = DailyCashSummary::where('id', $id)
                ->where('branch_id', $branchId)
                ->first();

            if (!$eodSummary) {
                return response()->json([
                    'status' => 404,
                    'message' => 'EOD summary not found',
                ], 404);
            }

            if (!in_array($eodSummary->eod_status, ['PENDING', 'SUBMITTED'])) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This EOD is not pending approval',
                ], 400);
            }

            $eodSummary->update([
                'eod_status' => 'APPROVED',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => null, // Clear any previous rejection
            ]);

            // Create notification for cashier
            $cashier = User::find($eodSummary->cashier_id);
            if ($cashier) {
                Notification::create([
                    'user_id' => $cashier->id,
                    'type' => 'eod_approved',
                    'title' => 'EOD Approved',
                    'message' => 'Your End of Day report for ' . Carbon::parse($eodSummary->summary_date)->format('M d, Y') . ' has been approved.',
                    'link' => '/billing/eod',
                    'is_read' => false,
                ]);
            }

            return response()->json([
                'status' => 200,
                'message' => 'EOD approved successfully',
                'data' => $eodSummary,
            ]);
        } catch (\Exception $e) {
            Log::error('Branch Admin approve EOD error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to approve EOD',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject a cashier's EOD (send back for revision)
     */
    public function rejectEOD(Request $request, $id)
    {
        try {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'rejection_reason' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $branchId = $user->branch_id;

            $eodSummary = DailyCashSummary::where('id', $id)
                ->where('branch_id', $branchId)
                ->first();

            if (!$eodSummary) {
                return response()->json([
                    'status' => 404,
                    'message' => 'EOD summary not found',
                ], 404);
            }

            if (!in_array($eodSummary->eod_status, ['PENDING', 'SUBMITTED'])) {
                return response()->json([
                    'status' => 400,
                    'message' => 'This EOD is not pending approval',
                ], 400);
            }

            $eodSummary->update([
                'eod_status' => 'REJECTED',
                'rejection_reason' => $request->rejection_reason,
                'approved_by' => $user->id,
                'approved_at' => null,
            ]);

            // Create notification for cashier
            $cashier = User::find($eodSummary->cashier_id);
            if ($cashier) {
                Notification::create([
                    'user_id' => $cashier->id,
                    'type' => 'eod_rejected',
                    'title' => 'EOD Needs Revision',
                    'message' => 'Your End of Day report for ' . Carbon::parse($eodSummary->summary_date)->format('M d, Y') . ' needs revision: ' . $request->rejection_reason,
                    'link' => '/billing/eod',
                    'is_read' => false,
                ]);
            }

            return response()->json([
                'status' => 200,
                'message' => 'EOD rejected and sent back to cashier for revision',
                'data' => $eodSummary,
            ]);
        } catch (\Exception $e) {
            Log::error('Branch Admin reject EOD error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to reject EOD',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
