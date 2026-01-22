<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Cashier\BillingTransaction;
use App\Models\Cashier\CashEntry;
use App\Models\Cashier\DailyCashSummary;
use App\Models\AllUsers\User;
use App\Models\Branch;
use App\Models\Notification;
use App\Services\POSAuditService;
use App\Traits\EnforcesBranchIsolation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SuperAdminPOSController extends Controller
{
    use EnforcesBranchIsolation;
    /**
     * Get Super Admin POS Dashboard Stats
     * Shows aggregated data across all branches or filtered by branch_id
     */
    public function getDashboardStats(Request $request)
    {
        try {
            $branchId = $request->get('branch_id'); // Optional: filter by specific branch
            $today = Carbon::today();
            $yesterday = Carbon::yesterday();

            // Build base query
            $todayQuery = BillingTransaction::forDate($today);
            $yesterdayQuery = BillingTransaction::forDate($yesterday);
            $cashInQuery = CashEntry::forDate($today)->cashIn();
            $cashOutQuery = CashEntry::forDate($today)->cashOut();

            // Apply branch filter if provided
            if ($branchId) {
                $todayQuery->forBranch($branchId);
                $yesterdayQuery->forBranch($branchId);
                $cashInQuery->forBranch($branchId);
                $cashOutQuery->forBranch($branchId);
            }

            // Today's transactions
            $todayTransactions = $todayQuery->get();
            $todaySales = $todayTransactions->sum('paid_amount');
            $transactionCount = $todayTransactions->count();

            // Yesterday's sales for comparison
            $yesterdaySales = $yesterdayQuery->sum('paid_amount');

            // Payment mode breakdown
            $paymentBreakdown = [
                'cash' => $todayTransactions->where('payment_method', 'CASH')->sum('paid_amount'),
                'card' => $todayTransactions->where('payment_method', 'CARD')->sum('paid_amount'),
                'online' => $todayTransactions->where('payment_method', 'ONLINE')->sum('paid_amount'),
                'qr' => $todayTransactions->where('payment_method', 'QR')->sum('paid_amount'),
            ];

            // Cash entries
            $todayCashIn = $cashInQuery->sum('amount');
            $todayCashOut = $cashOutQuery->sum('amount');

            // Get branch performance
            $branchPerformance = $this->getBranchPerformance($today, $branchId);

            // Calculate sales change percentage
            $salesChangePercentage = $yesterdaySales > 0 
                ? (($todaySales - $yesterdaySales) / $yesterdaySales) * 100 
                : ($todaySales > 0 ? 100 : 0);

            // Get all branches for dropdown
            $branches = Branch::select('id', 'center_name', 'center_type')
                ->orderBy('center_name')
                ->get();

            $selectedBranch = null;
            if ($branchId) {
                $selectedBranch = Branch::find($branchId);
            }

            return response()->json([
                'status' => 200,
                'data' => [
                    'selected_branch' => $selectedBranch ? [
                        'id' => $selectedBranch->id,
                        'name' => $selectedBranch->center_name,
                    ] : null,
                    'all_branches' => $branches->map(function ($branch) {
                        return [
                            'id' => $branch->id,
                            'name' => $branch->center_name,
                            'type' => $branch->center_type,
                        ];
                    }),
                    'today_stats' => [
                        'date' => $today->format('Y-m-d'),
                        'total_sales' => (float) $todaySales,
                        'transaction_count' => $transactionCount,
                        'cash_in' => (float) $todayCashIn,
                        'cash_out' => (float) $todayCashOut,
                        'net_cash' => (float) ($todayCashIn - $todayCashOut + $paymentBreakdown['cash']),
                    ],
                    'payment_breakdown' => $paymentBreakdown,
                    'branch_performance' => $branchPerformance,
                    'comparison' => [
                        'yesterday_sales' => (float) $yesterdaySales,
                        'sales_change_percentage' => round($salesChangePercentage, 2),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Super Admin POS dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get Consolidated Analytics across all branches
     */
    public function getAnalytics(Request $request)
    {
        try {
            $branchId = $request->get('branch_id');
            $range = $request->get('range', '7days');

            // Determine date range
            switch ($range) {
                case '30days':
                    $startDate = Carbon::now()->subDays(30);
                    break;
                case 'thisMonth':
                    $startDate = Carbon::now()->startOfMonth();
                    break;
                case '3months':
                    $startDate = Carbon::now()->subMonths(3);
                    break;
                default:
                    $startDate = Carbon::now()->subDays(7);
            }
            $endDate = Carbon::now();

            // Build base query
            $transactionQuery = BillingTransaction::whereBetween('created_at', [$startDate, $endDate]);
            $cashInQuery = CashEntry::whereBetween('created_at', [$startDate, $endDate])->cashIn();
            $cashOutQuery = CashEntry::whereBetween('created_at', [$startDate, $endDate])->cashOut();

            // Apply branch filter if provided
            if ($branchId) {
                $transactionQuery->forBranch($branchId);
                $cashInQuery->forBranch($branchId);
                $cashOutQuery->forBranch($branchId);
            }

            $transactions = $transactionQuery->get();
            $totalSales = $transactions->sum('paid_amount');
            $transactionCount = $transactions->count();
            $avgTransaction = $transactionCount > 0 ? $totalSales / $transactionCount : 0;

            $cashIn = $cashInQuery->sum('amount');
            $cashOut = $cashOutQuery->sum('amount');

            // Daily sales breakdown
            $dailySalesQuery = BillingTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('DATE(created_at) as date, SUM(paid_amount) as sales, COUNT(*) as transactions');
            
            if ($branchId) {
                $dailySalesQuery->forBranch($branchId);
            }

            $dailySales = $dailySalesQuery
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

            // Branch comparison (only if no specific branch is selected)
            $branchComparison = [];
            if (!$branchId) {
                $branchComparison = BillingTransaction::whereBetween('created_at', [$startDate, $endDate])
                    ->join('branches', 'billing_transactions.branch_id', '=', 'branches.id')
                    ->selectRaw('branches.id, branches.center_name, SUM(billing_transactions.paid_amount) as total_sales, COUNT(*) as transaction_count')
                    ->groupBy('branches.id', 'branches.center_name')
                    ->orderByDesc('total_sales')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'name' => $item->center_name,
                            'total_sales' => (float) $item->total_sales,
                            'transaction_count' => (int) $item->transaction_count,
                        ];
                    });
            }

            // Top cashiers (across all branches or filtered)
            $topCashiersQuery = BillingTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('cashier_id, branch_id, SUM(paid_amount) as total_sales, COUNT(*) as transaction_count')
                ->groupBy('cashier_id', 'branch_id')
                ->orderByDesc('total_sales')
                ->limit(10);

            if ($branchId) {
                $topCashiersQuery->forBranch($branchId);
            }

            $topCashiers = $topCashiersQuery->get()->map(function ($item) {
                $cashier = User::find($item->cashier_id);
                $branch = Branch::find($item->branch_id);
                return [
                    'id' => $item->cashier_id,
                    'name' => $cashier ? $cashier->name : 'Unknown',
                    'branch_name' => $branch ? $branch->center_name : 'Unknown',
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

            // Get all branches for filter dropdown
            $branches = Branch::select('id', 'center_name')->orderBy('center_name')->get();

            return response()->json([
                'status' => 200,
                'data' => [
                    'branches' => $branches->map(fn($b) => ['id' => $b->id, 'name' => $b->center_name]),
                    'selected_branch_id' => $branchId,
                    'summary' => [
                        'total_sales' => (float) $totalSales,
                        'total_transactions' => $transactionCount,
                        'average_transaction' => (float) round($avgTransaction, 2),
                        'total_cash_in' => (float) $cashIn,
                        'total_cash_out' => (float) $cashOut,
                    ],
                    'daily_sales' => $dailySales,
                    'payment_trends' => $paymentTrends,
                    'branch_comparison' => $branchComparison,
                    'top_cashiers' => $topCashiers,
                    'top_products' => $topProducts,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Super Admin analytics error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch analytics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all transactions with optional branch filter
     */
    public function getTransactions(Request $request)
    {
        try {
            $query = BillingTransaction::with(['cashier:id,name', 'patient:id,name,phone', 'branch:id,center_name'])
                ->orderBy('created_at', 'desc');

            // Branch filter
            if ($request->has('branch_id')) {
                $query->forBranch($request->branch_id);
            }

            // Date filter
            if ($request->has('date')) {
                $query->forDate(Carbon::parse($request->date));
            }

            // Date range filter
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('created_at', [
                    Carbon::parse($request->start_date)->startOfDay(),
                    Carbon::parse($request->end_date)->endOfDay(),
                ]);
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

            // Get branches for filter
            $branches = Branch::select('id', 'center_name')->orderBy('center_name')->get();

            return response()->json([
                'status' => 200,
                'branches' => $branches->map(fn($b) => ['id' => $b->id, 'name' => $b->center_name]),
                'data' => $transactions,
            ]);
        } catch (\Exception $e) {
            Log::error('Super Admin transactions error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch transactions',
            ], 500);
        }
    }

    /**
     * Get branch performance for today
     */
    private function getBranchPerformance($date, $filterBranchId = null)
    {
        $query = BillingTransaction::forDate($date)
            ->join('branches', 'billing_transactions.branch_id', '=', 'branches.id')
            ->selectRaw('branches.id, branches.center_name, branches.center_type, SUM(billing_transactions.paid_amount) as total_sales, COUNT(*) as transaction_count')
            ->groupBy('branches.id', 'branches.center_name', 'branches.center_type')
            ->orderByDesc('total_sales');

        if ($filterBranchId) {
            $query->where('branches.id', $filterBranchId);
        }

        return $query->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->center_name,
                'type' => $item->center_type,
                'total_sales' => (float) $item->total_sales,
                'transaction_count' => (int) $item->transaction_count,
            ];
        });
    }

    /**
     * Get all branches list
     */
    public function getBranches()
    {
        try {
            $branches = Branch::select('id', 'center_name', 'center_type', 'city', 'address', 'phone', 'is_active')
                ->orderBy('center_name')
                ->get()
                ->map(function ($branch) {
                    return [
                        'id' => $branch->id,
                        'name' => $branch->center_name,
                        'center_name' => $branch->center_name,
                        'type' => $branch->center_type,
                        'city' => $branch->city ?? '',
                        'address' => $branch->address ?? '',
                        'phone' => $branch->phone ?? '',
                        'is_active' => $branch->is_active,
                    ];
                });

            return response()->json([
                'status' => 200,
                'branches' => $branches,
                'data' => $branches, // For backward compatibility
            ]);
        } catch (\Exception $e) {
            Log::error('Get branches error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch branches',
                'branches' => [],
            ], 500);
        }
    }

    /**
     * Create a transaction on behalf of any branch (Super Admin only)
     * Super Admin can perform sales for any branch
     */
    public function createTransaction(Request $request)
    {
        try {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'branch_id' => 'required|exists:branches,id',
                'transaction_type' => 'required|in:OPD,LAB,PHARMACY,SERVICE,OTHER',
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
            $branchId = $request->branch_id;
            $today = Carbon::today();

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
                'remarks' => $request->remarks . ' [Created by Super Admin]',
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

            // Audit log: Transaction created by super admin
            $cashierId = $request->cashier_id ?? null;
            POSAuditService::logTransaction($transaction->id, [
                'invoice_number' => $transaction->invoice_number,
                'total_amount' => $transaction->total_amount,
                'payment_method' => $transaction->payment_method,
                'patient_name' => $transaction->patient_name,
                'items_count' => count($request->service_details ?? []),
                'created_by_role' => 'super_admin',
                'on_behalf_of_cashier' => $cashierId,
            ], $branchId);

            return response()->json([
                'status' => 201,
                'message' => 'Transaction created successfully for branch',
                'data' => $transaction,
                'low_stock_warning' => !empty($lowStockItems) ? $lowStockItems : null,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Super Admin create transaction error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create transaction',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get branch cashiers with their performance
     */
    public function getBranchCashiers(Request $request)
    {
        try {
            $branchId = $request->get('branch_id');
            $today = Carbon::today();

            $query = User::where('role_as', 6); // Cashier role

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $cashiers = $query->with('branch:id,center_name')
                ->get()
                ->map(function ($cashier) use ($today) {
                    $todayTransactions = BillingTransaction::forCashier($cashier->id)
                        ->forDate($today)
                        ->get();

                    $eodSummary = DailyCashSummary::forCashier($cashier->id)
                        ->forDate($today)
                        ->first();

                    return [
                        'id' => $cashier->id,
                        'name' => $cashier->name,
                        'email' => $cashier->email,
                        'branch_id' => $cashier->branch_id,
                        'branch_name' => $cashier->branch->center_name ?? 'N/A',
                        'today_sales' => (float) $todayTransactions->sum('paid_amount'),
                        'today_transactions' => $todayTransactions->count(),
                        'eod_status' => $eodSummary ? $eodSummary->eod_status : 'OPEN',
                        'is_active' => $cashier->is_active ?? true,
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
     * Get products for a specific branch
     */
    public function getBranchProducts(Request $request)
    {
        try {
            $branchId = $request->get('branch_id');
            $search = $request->get('search', '');

            $query = DB::table('products')
                ->leftJoin('products_stock', function ($join) use ($branchId) {
                    $join->on('products.id', '=', 'products_stock.product_id');
                    if ($branchId) {
                        // Include stock for the specific branch OR stock with null branch_id (global stock)
                        $join->where(function ($q) use ($branchId) {
                            $q->where('products_stock.branch_id', '=', $branchId)
                              ->orWhereNull('products_stock.branch_id');
                        });
                    }
                })
                ->select(
                    'products.id',
                    'products.item_name',
                    'products.item_code',
                    'products.category',
                    'products_stock.unit_selling_price as selling_price',
                    'products_stock.current_stock as stock',
                    'products_stock.unit_cost',
                    'products_stock.expiry_date',
                    'products_stock.branch_id as stock_branch_id'
                );

            // Filter to include branch-specific OR global (null branch) stock
            if ($branchId) {
                $query->where(function ($q) use ($branchId) {
                    $q->where('products_stock.branch_id', $branchId)
                      ->orWhereNull('products_stock.branch_id');
                });
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('products.item_name', 'like', "%{$search}%")
                      ->orWhere('products.item_code', 'like', "%{$search}%");
                });
            }

            $products = $query->orderBy('products.item_name')->limit(50)->get();

            // If no products found with branch filter, try without branch filter
            if ($products->isEmpty()) {
                $fallbackQuery = DB::table('products')
                    ->leftJoin('products_stock', 'products.id', '=', 'products_stock.product_id')
                    ->select(
                        'products.id',
                        'products.item_name',
                        'products.item_code',
                        'products.category',
                        'products_stock.unit_selling_price as selling_price',
                        'products_stock.current_stock as stock',
                        'products_stock.unit_cost',
                        'products_stock.expiry_date'
                    );
                
                if ($search) {
                    $fallbackQuery->where(function ($q) use ($search) {
                        $q->where('products.item_name', 'like', "%{$search}%")
                          ->orWhere('products.item_code', 'like', "%{$search}%");
                    });
                }
                
                $products = $fallbackQuery->orderBy('products.item_name')->limit(50)->get();
            }

            // Transform to ensure numeric values
            $products = $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'item_name' => $product->item_name,
                    'item_code' => $product->item_code,
                    'category' => $product->category ?? '',
                    'selling_price' => (float) ($product->selling_price ?? 0),
                    'stock' => (int) ($product->stock ?? 0),
                    'unit_cost' => (float) ($product->unit_cost ?? 0),
                    'expiry_date' => $product->expiry_date ?? null,
                ];
            });

            return response()->json([
                'status' => 200,
                'products' => $products,
                'data' => $products, // backward compatibility
            ]);
        } catch (\Exception $e) {
            Log::error('Get branch products error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch products',
                'products' => [],
            ], 500);
        }
    }

    /**
     * Generate invoice number
     */
    private function generateInvoiceNumber($branchId)
    {
        $branch = Branch::find($branchId);
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
        $branch = Branch::find($branchId);
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

                // Notify branch admin, pharmacists for this branch, and super admins
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
}
