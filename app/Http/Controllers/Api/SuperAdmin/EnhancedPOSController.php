<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\POS\BatchPricingService;
use App\Services\POS\DiscountService;
use App\Services\POS\PricingControlService;
use App\Models\POS\POSDiscount;
use App\Models\POS\PricingControl;
use App\Models\POS\InventoryBatch;
use App\Models\POS\POSAuditLog;
use App\Models\POS\PriceOverrideRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EnhancedPOSController extends Controller
{
    protected BatchPricingService $batchService;
    protected DiscountService $discountService;
    protected PricingControlService $pricingService;

    public function __construct(
        BatchPricingService $batchService,
        DiscountService $discountService,
        PricingControlService $pricingService
    ) {
        $this->batchService = $batchService;
        $this->discountService = $discountService;
        $this->pricingService = $pricingService;
    }

    // ==================== BATCH PRICING ====================

    /**
     * Get available batches for a product
     */
    public function getProductBatches(Request $request, string $productId): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id);
        
        $batches = $this->batchService->getAvailableBatches($productId, $branchId);
        $totalStock = $this->batchService->getTotalStock($productId, $branchId);
        $sellingPrice = $this->batchService->getSellingPrice($productId, $branchId);

        return response()->json([
            'success' => true,
            'data' => [
                'batches' => $batches,
                'total_stock' => $totalStock,
                'selling_price' => $sellingPrice,
                'strategy' => config('pos.pricing_strategy', 'fifo'),
            ],
        ]);
    }

    /**
     * Get stock aging report
     */
    public function getStockAgingReport(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id);
        $agingDays = $request->input('aging_days', 90);

        $report = $this->batchService->getStockAgingReport($branchId, $agingDays);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Get expiring soon report
     */
    public function getExpiringSoonReport(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id);
        $days = $request->input('days', 30);

        $report = $this->batchService->getExpiringSoonReport($branchId, $days);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Get batch profit analysis
     */
    public function getBatchProfitAnalysis(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id);
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $analysis = $this->batchService->getBatchProfitAnalysis($branchId, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $analysis,
        ]);
    }

    // ==================== DISCOUNTS ====================

    /**
     * Get applicable discounts for cart
     */
    public function getApplicableDiscounts(Request $request): JsonResponse
    {
        $request->validate([
            'cart_items' => 'required|array',
            'cart_items.*.product_id' => 'required|string',
            'cart_items.*.amount' => 'required|numeric|min:0',
            'cart_items.*.quantity' => 'required|integer|min:1',
        ]);

        $branchId = $request->input('branch_id', auth()->user()->branch_id);
        $isCashier = auth()->user()->role_as === 6;

        $discounts = $this->discountService->getApplicableDiscounts(
            $request->cart_items,
            $branchId,
            $isCashier
        );

        $bestDiscount = $this->discountService->calculateBestDiscount($discounts);

        return response()->json([
            'success' => true,
            'data' => [
                'all_discounts' => $discounts,
                'recommended' => $bestDiscount,
            ],
        ]);
    }

    /**
     * Get active offers
     */
    public function getActiveOffers(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id);
        
        $offers = $this->discountService->getActiveOffers($branchId);

        return response()->json([
            'success' => true,
            'data' => $offers,
        ]);
    }

    /**
     * Apply discount to transaction
     */
    public function applyDiscount(Request $request): JsonResponse
    {
        $request->validate([
            'transaction_id' => 'required|string',
            'discount_id' => 'nullable|string',
            'type' => 'required_without:discount_id|in:percentage,fixed',
            'value' => 'required_without:discount_id|numeric|min:0',
            'original_amount' => 'required|numeric|min:0',
            'product_id' => 'nullable|string',
            'item_index' => 'nullable|integer',
            'reason' => 'nullable|string|max:255',
        ]);

        $user = auth()->user();

        if ($request->discount_id) {
            // Apply predefined discount
            $discount = POSDiscount::findOrFail($request->discount_id);
            
            // Check if user can apply
            $canApply = $this->discountService->canApplyDiscount($discount, $user->role_as);
            
            if (!$canApply['allowed']) {
                return response()->json([
                    'success' => false,
                    'message' => $canApply['message'],
                ], 403);
            }

            $transactionDiscount = $this->discountService->applyDiscount(
                $request->transaction_id,
                $discount,
                $request->original_amount,
                $user->id,
                $request->product_id,
                $request->item_index,
                $canApply['requires_approval'] ? null : $user->id
            );
        } else {
            // Apply manual discount
            $transactionDiscount = $this->discountService->applyManualDiscount(
                $request->transaction_id,
                $request->type,
                $request->value,
                $request->original_amount,
                $user->id,
                $request->product_id,
                $request->item_index,
                $user->role_as < 3 ? $user->id : null, // Auto-approve for managers
                $request->reason
            );
        }

        return response()->json([
            'success' => true,
            'data' => $transactionDiscount,
            'message' => 'Discount applied successfully',
        ]);
    }

    /**
     * Get discount impact report
     */
    public function getDiscountImpactReport(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id);
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $report = $this->discountService->getDiscountImpactReport($branchId, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Create/update discount (Super Admin / Branch Admin)
     */
    public function storeDiscount(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'scope' => 'required|in:item,category,bill',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'product_id' => 'nullable|string',
            'category' => 'nullable|string',
            'branch_id' => 'nullable|string',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'min_purchase_amount' => 'nullable|numeric|min:0',
            'min_quantity' => 'nullable|integer|min:1',
            'max_uses_per_customer' => 'nullable|integer|min:1',
            'max_uses_total' => 'nullable|integer|min:1',
            'priority' => 'nullable|integer|min:1',
            'requires_approval' => 'nullable|boolean',
            'cashier_can_apply' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $user = auth()->user();

        // Only Super Admin can create global discounts
        if (!$request->branch_id && $user->role_as !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Only Super Admin can create global discounts',
            ], 403);
        }

        $discount = POSDiscount::create([
            ...$request->all(),
            'branch_id' => $request->branch_id ?? $user->branch_id,
            'is_global' => !$request->branch_id,
            'is_period_based' => $request->valid_from && $request->valid_until,
            'created_by' => $user->id,
        ]);

        // Log action
        POSAuditLog::logAction(
            POSAuditLog::ACTION_DISCOUNT_CREATED,
            'discount',
            $discount->id,
            [
                'user_id' => $user->id,
                'details' => $request->all(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $discount,
            'message' => 'Discount created successfully',
        ], 201);
    }

    /**
     * Update discount
     */
    public function updateDiscount(Request $request, string $id): JsonResponse
    {
        $discount = POSDiscount::findOrFail($id);
        $user = auth()->user();

        // Check permission
        if (!$discount->is_global && $discount->branch_id !== $user->branch_id && $user->role_as !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit discounts for your branch',
            ], 403);
        }

        $oldValues = $discount->toArray();
        $discount->update($request->all());

        // Log action
        POSAuditLog::logAction(
            POSAuditLog::ACTION_DISCOUNT_MODIFIED,
            'discount',
            $discount->id,
            [
                'user_id' => $user->id,
                'old_value' => $oldValues,
                'new_value' => $discount->toArray(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $discount,
            'message' => 'Discount updated successfully',
        ]);
    }

    /**
     * Delete discount
     */
    public function deleteDiscount(string $id): JsonResponse
    {
        $discount = POSDiscount::findOrFail($id);
        $user = auth()->user();

        // Only Super Admin can delete global discounts
        if ($discount->is_global && $user->role_as !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Only Super Admin can delete global discounts',
            ], 403);
        }

        $discount->delete();

        // Log action
        POSAuditLog::logAction(
            POSAuditLog::ACTION_DISCOUNT_REMOVED,
            'discount',
            $id,
            [
                'user_id' => $user->id,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Discount deleted successfully',
        ]);
    }

    // ==================== PRICING CONTROLS ====================

    /**
     * Get pricing control for a product
     */
    public function getPricingControl(Request $request, string $productId): JsonResponse
    {
        $branchId = $request->input('branch_id');
        
        $priceRange = $this->pricingService->getPriceRange($productId, $branchId);

        return response()->json([
            'success' => true,
            'data' => $priceRange,
        ]);
    }

    /**
     * Validate a price
     */
    public function validatePrice(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|string',
            'price' => 'required|numeric|min:0',
        ]);

        $result = $this->pricingService->validatePrice(
            $request->product_id,
            $request->price,
            $request->branch_id
        );

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Create/update pricing control (Super Admin only)
     */
    public function storePricingControl(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|string|exists:products,id',
            'default_selling_price' => 'nullable|numeric|min:0',
            'min_selling_price' => 'nullable|numeric|min:0',
            'max_selling_price' => 'nullable|numeric|min:0',
            'max_discount_percentage' => 'nullable|numeric|min:0|max:100',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'allow_manual_price' => 'nullable|boolean',
            'requires_approval_below_min' => 'nullable|boolean',
            'branch_id' => 'nullable|string',
        ]);

        $user = auth()->user();

        // Only Super Admin can set global pricing controls
        if (!$request->branch_id && $user->role_as !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Only Super Admin can set global pricing controls',
            ], 403);
        }

        $control = $this->pricingService->setPricingControl(
            $request->product_id,
            $request->except(['product_id', 'branch_id']),
            $request->branch_id,
            $user->id
        );

        return response()->json([
            'success' => true,
            'data' => $control,
            'message' => 'Pricing control saved successfully',
        ]);
    }

    /**
     * Get all pricing controls
     */
    public function listPricingControls(Request $request): JsonResponse
    {
        $query = PricingControl::with('product:id,item_name,item_code');

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id)
                  ->orWhere('is_global', true);
        }

        $controls = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $controls,
        ]);
    }

    // ==================== PRICE OVERRIDE REQUESTS ====================

    /**
     * Create price override request
     */
    public function createOverrideRequest(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|string',
            'original_price' => 'required|numeric|min:0',
            'requested_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|max:500',
            'batch_id' => 'nullable|string',
        ]);

        $user = auth()->user();
        $branchId = $request->input('branch_id', $user->branch_id);

        $overrideRequest = $this->pricingService->createOverrideRequest(
            $request->product_id,
            $request->original_price,
            $request->requested_price,
            $request->quantity,
            $request->reason,
            $branchId,
            $user->id,
            $request->batch_id
        );

        return response()->json([
            'success' => true,
            'data' => $overrideRequest,
            'message' => 'Override request created. Awaiting approval.',
        ]);
    }

    /**
     * Get pending override requests
     */
    public function getPendingOverrideRequests(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id);
        
        $requests = $this->pricingService->getPendingRequests($branchId);

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Approve override request
     */
    public function approveOverrideRequest(Request $request, string $id): JsonResponse
    {
        $overrideRequest = PriceOverrideRequest::findOrFail($id);
        $user = auth()->user();

        if (!in_array($user->role_as, [1, 2])) {
            return response()->json([
                'success' => false,
                'message' => 'Only managers can approve override requests',
            ], 403);
        }

        $overrideRequest->approve($user, $request->notes);

        return response()->json([
            'success' => true,
            'data' => $overrideRequest->fresh(),
            'message' => 'Price override approved',
        ]);
    }

    /**
     * Deny override request
     */
    public function denyOverrideRequest(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $overrideRequest = PriceOverrideRequest::findOrFail($id);
        $user = auth()->user();

        if (!in_array($user->role_as, [1, 2])) {
            return response()->json([
                'success' => false,
                'message' => 'Only managers can deny override requests',
            ], 403);
        }

        $overrideRequest->deny($user, $request->rejection_reason);

        return response()->json([
            'success' => true,
            'message' => 'Price override denied',
        ]);
    }

    // ==================== AUDIT LOGS ====================

    /**
     * Get POS audit logs
     */
    public function getAuditLogs(Request $request): JsonResponse
    {
        $query = POSAuditLog::with(['user:id,first_name,last_name', 'branch:id,name']);

        if ($request->branch_id) {
            $query->forBranch($request->branch_id);
        }

        if ($request->action) {
            $query->byAction($request->action);
        }

        if ($request->user_id) {
            $query->byUser($request->user_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->inPeriod($request->start_date, $request->end_date);
        }

        $logs = $query->orderBy('created_at', 'desc')
                      ->paginate($request->input('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Get discount impact from audit logs
     */
    public function getDiscountImpactFromLogs(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $report = POSAuditLog::getDiscountImpactReport($branchId, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Get price override report
     */
    public function getPriceOverrideReport(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $report = POSAuditLog::getPriceOverrideReport($branchId, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    // ==================== DASHBOARD STATS ====================

    /**
     * Get enhanced POS dashboard stats
     */
    public function getDashboardStats(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id') ?? auth()->user()->branch_id;
        $today = now()->format('Y-m-d');
        $startOfMonth = now()->startOfMonth()->format('Y-m-d');
        $endOfMonth = now()->endOfMonth()->format('Y-m-d');

        // If no branch specified, return aggregate stats for all branches
        if (!$branchId) {
            return $this->getAggregateDashboardStats($today, $startOfMonth, $endOfMonth);
        }

        try {
            // Pending override requests
            $pendingOverrides = PriceOverrideRequest::pending()
                ->forBranch($branchId)
                ->count();

            // Today's discount impact
            $todayDiscountImpact = $this->discountService->getDiscountImpactReport(
                $branchId, $today, $today
            );

            // Expiring soon items
            $expiringSoon = InventoryBatch::forBranch($branchId)
                ->expiringSoon(30)
                ->active()
                ->count();

            // Low stock items (using batch system)
            $lowStockItems = DB::table('inventory_batches')
                ->select('product_id', DB::raw('SUM(current_quantity) as total_stock'))
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->groupBy('product_id')
                ->having('total_stock', '<', 10)
                ->count();

            // Active discounts count
            $activeDiscounts = POSDiscount::active()
                ->valid()
                ->forBranch($branchId)
                ->count();

            // Month profit analysis
            $profitAnalysis = $this->batchService->getBatchProfitAnalysis(
                $branchId, $startOfMonth, $endOfMonth
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'pending_overrides' => $pendingOverrides,
                    'today_discount_total' => $todayDiscountImpact['summary']['total_discount_given'] ?? 0,
                    'expiring_soon_count' => $expiringSoon,
                    'low_stock_count' => $lowStockItems,
                    'active_discounts' => $activeDiscounts,
                    'month_profit' => $profitAnalysis['expected_profit'] ?? 0,
                    'month_margin' => $profitAnalysis['average_margin'] ?? 0,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'data' => [
                    'pending_overrides' => 0,
                    'today_discount_total' => 0,
                    'expiring_soon_count' => 0,
                    'low_stock_count' => 0,
                    'active_discounts' => 0,
                    'month_profit' => 0,
                    'month_margin' => 0,
                ],
                'message' => 'Stats unavailable for this branch'
            ]);
        }
    }

    /**
     * Get aggregate stats across all branches (for Super Admin without branch selected)
     */
    private function getAggregateDashboardStats(string $today, string $startOfMonth, string $endOfMonth): JsonResponse
    {
        try {
            // Pending override requests across all branches
            $pendingOverrides = PriceOverrideRequest::pending()->count();

            // Expiring soon items across all branches
            $expiringSoon = InventoryBatch::expiringSoon(30)
                ->active()
                ->count();

            // Low stock items across all branches
            $lowStockItems = DB::table('inventory_batches')
                ->select('product_id', 'branch_id', DB::raw('SUM(current_quantity) as total_stock'))
                ->where('is_active', true)
                ->groupBy('product_id', 'branch_id')
                ->having('total_stock', '<', 10)
                ->count();

            // Active discounts count across all branches
            $activeDiscounts = POSDiscount::active()->valid()->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'pending_overrides' => $pendingOverrides,
                    'today_discount_total' => 0,
                    'expiring_soon_count' => $expiringSoon,
                    'low_stock_count' => $lowStockItems,
                    'active_discounts' => $activeDiscounts,
                    'month_profit' => 0,
                    'month_margin' => 0,
                ],
                'message' => 'Aggregate stats - select a branch for detailed analysis'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'data' => [
                    'pending_overrides' => 0,
                    'today_discount_total' => 0,
                    'expiring_soon_count' => 0,
                    'low_stock_count' => 0,
                    'active_discounts' => 0,
                    'month_profit' => 0,
                    'month_margin' => 0,
                ],
            ]);
        }
    }
}
