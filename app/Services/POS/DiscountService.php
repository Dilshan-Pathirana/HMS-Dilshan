<?php

namespace App\Services\POS;

use App\Models\POS\POSDiscount;
use App\Models\POS\PricingControl;
use App\Models\POS\TransactionDiscount;
use App\Models\POS\POSAuditLog;
use App\Models\Pharmacy\Product;
use App\Models\SystemSettings;
use Illuminate\Support\Collection;

/**
 * Discount Service
 * 
 * Handles discount application with priority rules:
 * 1. Item-level discount (highest priority)
 * 2. Period discount
 * 3. Bill-level discount (lowest priority)
 * 
 * Enforces discount limits and stacking rules
 */
class DiscountService
{
    protected BatchPricingService $batchService;

    public function __construct(BatchPricingService $batchService)
    {
        $this->batchService = $batchService;
    }

    /**
     * Get all applicable discounts for a cart
     */
    public function getApplicableDiscounts(array $cartItems, string $branchId, bool $isCashier = true): array
    {
        $discounts = [
            'item_discounts' => [],
            'bill_discounts' => [],
            'period_discounts' => [],
        ];

        $totalAmount = 0;

        // Get item-level and category discounts
        foreach ($cartItems as $index => $item) {
            $productId = $item['product_id'];
            $category = $item['category'] ?? null;
            $amount = $item['amount'] ?? 0;
            $quantity = $item['quantity'] ?? 1;
            $totalAmount += $amount;

            // Get applicable discounts for this item
            $itemDiscounts = POSDiscount::getApplicableForProduct(
                $productId, 
                $branchId, 
                $category, 
                $isCashier
            );

            foreach ($itemDiscounts as $discount) {
                $discountAmount = $discount->calculateDiscount($amount, $quantity);
                
                if ($discountAmount > 0) {
                    $discounts['item_discounts'][] = [
                        'discount' => $discount,
                        'item_index' => $index,
                        'product_id' => $productId,
                        'original_amount' => $amount,
                        'discount_amount' => $discountAmount,
                        'is_period_based' => $discount->is_period_based,
                    ];
                }
            }
        }

        // Get bill-level discounts
        $billDiscounts = POSDiscount::getApplicableForBill($branchId, $totalAmount, $isCashier);

        foreach ($billDiscounts as $discount) {
            $discountAmount = $discount->calculateDiscount($totalAmount);
            
            if ($discountAmount > 0) {
                $discounts['bill_discounts'][] = [
                    'discount' => $discount,
                    'original_amount' => $totalAmount,
                    'discount_amount' => $discountAmount,
                ];
            }
        }

        // Separate period-based discounts
        $discounts['period_discounts'] = array_filter(
            $discounts['item_discounts'], 
            fn($d) => $d['is_period_based']
        );

        return $discounts;
    }

    /**
     * Calculate best discount (non-stacking)
     * Priority: Item > Period > Bill
     */
    public function calculateBestDiscount(array $applicableDiscounts): array
    {
        $result = [
            'item_discounts' => [],
            'bill_discount' => null,
            'total_savings' => 0,
        ];

        // Apply item-level discounts (highest priority per item)
        $itemsByIndex = [];
        foreach ($applicableDiscounts['item_discounts'] as $discount) {
            $index = $discount['item_index'];
            
            // Keep only the best discount per item (by priority)
            if (!isset($itemsByIndex[$index]) || 
                $discount['discount']->priority < $itemsByIndex[$index]['discount']->priority) {
                $itemsByIndex[$index] = $discount;
            }
        }

        $result['item_discounts'] = array_values($itemsByIndex);
        $result['total_savings'] = array_sum(array_column($result['item_discounts'], 'discount_amount'));

        // If no item discounts, check bill discount
        if (empty($result['item_discounts']) && !empty($applicableDiscounts['bill_discounts'])) {
            // Get best bill discount by priority
            usort($applicableDiscounts['bill_discounts'], fn($a, $b) => 
                $a['discount']->priority <=> $b['discount']->priority
            );

            $result['bill_discount'] = $applicableDiscounts['bill_discounts'][0];
            $result['total_savings'] = $result['bill_discount']['discount_amount'];
        }

        return $result;
    }

    /**
     * Validate if discount can be applied by user role
     */
    public function canApplyDiscount(POSDiscount $discount, int $userRole): array
    {
        $result = [
            'allowed' => true,
            'requires_approval' => false,
            'message' => null,
        ];

        // Cashier restrictions
        if ($userRole === 6) { // Cashier role
            if (!$discount->cashier_can_apply) {
                $result['allowed'] = false;
                $result['message'] = 'Cashiers cannot apply this discount';
                return $result;
            }

            // Check max discount allowed for cashiers
            $maxCashierDiscount = SystemSettings::where('key', 'pos_max_cashier_discount_percent')
                ->value('value') ?? 10;

            if ($discount->type === 'percentage' && $discount->value > $maxCashierDiscount) {
                $result['requires_approval'] = true;
                $result['message'] = "Discount exceeds cashier limit ({$maxCashierDiscount}%)";
            }
        }

        if ($discount->requires_approval) {
            $result['requires_approval'] = true;
        }

        return $result;
    }

    /**
     * Apply discount to transaction and record it
     */
    public function applyDiscount(
        string $transactionId,
        POSDiscount $discount,
        float $originalAmount,
        string $appliedBy,
        ?string $productId = null,
        ?int $itemIndex = null,
        ?string $approvedBy = null
    ): TransactionDiscount {
        $discountAmount = $discount->calculateDiscount($originalAmount);

        $transactionDiscount = TransactionDiscount::create([
            'transaction_id' => $transactionId,
            'discount_id' => $discount->id,
            'applied_to' => $productId ? TransactionDiscount::APPLIED_TO_ITEM : TransactionDiscount::APPLIED_TO_BILL,
            'product_id' => $productId,
            'item_index' => $itemIndex,
            'discount_type' => $discount->type,
            'discount_value' => $discount->value,
            'discount_amount' => $discountAmount,
            'original_amount' => $originalAmount,
            'final_amount' => $originalAmount - $discountAmount,
            'required_approval' => $discount->requires_approval,
            'approved_by' => $approvedBy,
            'applied_by' => $appliedBy,
        ]);

        // Log the discount application
        POSAuditLog::logAction(
            POSAuditLog::ACTION_DISCOUNT_APPLIED,
            'discount',
            $discount->id,
            [
                'transaction_id' => $transactionId,
                'user_id' => $appliedBy,
                'old_value' => $originalAmount,
                'new_value' => $originalAmount - $discountAmount,
                'amount_impact' => $discountAmount,
                'details' => [
                    'discount_name' => $discount->name,
                    'discount_type' => $discount->type,
                    'discount_value' => $discount->value,
                    'product_id' => $productId,
                ],
            ]
        );

        return $transactionDiscount;
    }

    /**
     * Apply manual discount (not from predefined discounts)
     */
    public function applyManualDiscount(
        string $transactionId,
        string $type, // 'percentage' or 'fixed'
        float $value,
        float $originalAmount,
        string $appliedBy,
        ?string $productId = null,
        ?int $itemIndex = null,
        ?string $approvedBy = null,
        ?string $reason = null
    ): TransactionDiscount {
        // Calculate discount amount
        $discountAmount = $type === 'percentage' 
            ? $originalAmount * ($value / 100)
            : $value;

        $discountAmount = min($discountAmount, $originalAmount);

        $transactionDiscount = TransactionDiscount::create([
            'transaction_id' => $transactionId,
            'discount_id' => null, // Manual discount
            'applied_to' => $productId ? TransactionDiscount::APPLIED_TO_ITEM : TransactionDiscount::APPLIED_TO_BILL,
            'product_id' => $productId,
            'item_index' => $itemIndex,
            'discount_type' => $type,
            'discount_value' => $value,
            'discount_amount' => $discountAmount,
            'original_amount' => $originalAmount,
            'final_amount' => $originalAmount - $discountAmount,
            'required_approval' => $approvedBy !== null,
            'approved_by' => $approvedBy,
            'applied_by' => $appliedBy,
        ]);

        // Log the manual discount
        POSAuditLog::logAction(
            POSAuditLog::ACTION_DISCOUNT_APPLIED,
            'manual_discount',
            $transactionDiscount->id,
            [
                'transaction_id' => $transactionId,
                'user_id' => $appliedBy,
                'old_value' => $originalAmount,
                'new_value' => $originalAmount - $discountAmount,
                'amount_impact' => $discountAmount,
                'reason' => $reason,
                'details' => [
                    'is_manual' => true,
                    'discount_type' => $type,
                    'discount_value' => $value,
                    'product_id' => $productId,
                ],
            ]
        );

        return $transactionDiscount;
    }

    /**
     * Get active offers/discounts for display
     */
    public function getActiveOffers(string $branchId): Collection
    {
        return POSDiscount::active()
            ->valid()
            ->forBranch($branchId)
            ->with('product:id,item_name,item_code')
            ->byPriority()
            ->get()
            ->map(function ($discount) {
                return [
                    'id' => $discount->id,
                    'name' => $discount->name,
                    'description' => $discount->description,
                    'scope' => $discount->scope,
                    'type' => $discount->type,
                    'value' => $discount->value,
                    'value_display' => $discount->type === 'percentage' 
                        ? "{$discount->value}% off" 
                        : "Rs. {$discount->value} off",
                    'product' => $discount->product?->item_name,
                    'category' => $discount->category,
                    'valid_until' => $discount->valid_until?->format('Y-m-d'),
                    'min_purchase' => $discount->min_purchase_amount,
                    'cashier_can_apply' => $discount->cashier_can_apply,
                ];
            });
    }

    /**
     * Get discount impact report
     */
    public function getDiscountImpactReport(string $branchId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = TransactionDiscount::query()
            ->join('billing_transactions', 'transaction_discounts.transaction_id', '=', 'billing_transactions.id')
            ->where('billing_transactions.branch_id', $branchId);

        if ($startDate && $endDate) {
            $query->whereBetween('transaction_discounts.created_at', [$startDate, $endDate]);
        }

        $summary = $query->selectRaw('
            COUNT(DISTINCT transaction_discounts.transaction_id) as transactions_with_discount,
            COUNT(*) as total_discounts_applied,
            SUM(transaction_discounts.discount_amount) as total_discount_given,
            AVG(transaction_discounts.discount_amount) as avg_discount,
            SUM(transaction_discounts.original_amount) as total_original,
            SUM(transaction_discounts.final_amount) as total_final
        ')->first();

        // Get by discount type
        $byType = TransactionDiscount::query()
            ->join('billing_transactions', 'transaction_discounts.transaction_id', '=', 'billing_transactions.id')
            ->where('billing_transactions.branch_id', $branchId)
            ->when($startDate && $endDate, fn($q) => $q->whereBetween('transaction_discounts.created_at', [$startDate, $endDate]))
            ->selectRaw('
                applied_to,
                discount_type,
                COUNT(*) as count,
                SUM(discount_amount) as total
            ')
            ->groupBy('applied_to', 'discount_type')
            ->get();

        return [
            'summary' => [
                'transactions_with_discount' => $summary->transactions_with_discount ?? 0,
                'total_discounts_applied' => $summary->total_discounts_applied ?? 0,
                'total_discount_given' => $summary->total_discount_given ?? 0,
                'avg_discount' => round($summary->avg_discount ?? 0, 2),
                'total_before_discount' => $summary->total_original ?? 0,
                'total_after_discount' => $summary->total_final ?? 0,
                'discount_percentage' => $summary->total_original > 0 
                    ? round(($summary->total_discount_given / $summary->total_original) * 100, 2) 
                    : 0,
            ],
            'by_type' => $byType,
        ];
    }
}
