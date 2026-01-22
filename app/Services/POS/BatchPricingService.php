<?php

namespace App\Services\POS;

use App\Models\POS\InventoryBatch;
use App\Models\POS\POSAuditLog;
use App\Models\Pharmacy\Product;
use App\Models\SystemSettings;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Batch Pricing Service
 * 
 * Handles inventory batch selection and pricing strategies:
 * - FIFO (First In First Out) - Default
 * - FEFO (First Expiry First Out) - For perishables
 * - Weighted Average - For cost averaging
 * - Manual Selection - Admin only
 */
class BatchPricingService
{
    protected string $strategy;
    
    public function __construct()
    {
        $this->strategy = $this->getStrategy();
    }

    /**
     * Get configured pricing strategy
     */
    protected function getStrategy(): string
    {
        return SystemSettings::where('key', 'pos_pricing_strategy')
            ->value('value') ?? 'fifo';
    }

    /**
     * Get available batches for a product at a branch
     */
    public function getAvailableBatches(string $productId, string $branchId): Collection
    {
        return InventoryBatch::forProduct($productId)
            ->forBranch($branchId)
            ->active()
            ->get();
    }

    /**
     * Get the next batch to use based on strategy
     */
    public function getNextBatch(string $productId, string $branchId, float $requiredQuantity = 1): ?InventoryBatch
    {
        $query = InventoryBatch::forProduct($productId)
            ->forBranch($branchId)
            ->active()
            ->where('current_quantity', '>=', $requiredQuantity);

        switch ($this->strategy) {
            case 'fefo':
                return $query->fefoOrder()->first();
            case 'fifo':
            default:
                return $query->fifoOrder()->first();
        }
    }

    /**
     * Get batches to fulfill a quantity (may span multiple batches)
     * Returns array of [batch, quantity_to_use]
     */
    public function getBatchesForQuantity(string $productId, string $branchId, float $requiredQuantity): array
    {
        $batches = [];
        $remainingQuantity = $requiredQuantity;

        $query = InventoryBatch::forProduct($productId)
            ->forBranch($branchId)
            ->active()
            ->where('current_quantity', '>', 0);

        // Apply ordering based on strategy
        switch ($this->strategy) {
            case 'fefo':
                $query->fefoOrder();
                break;
            case 'fifo':
            default:
                $query->fifoOrder();
                break;
        }

        $availableBatches = $query->get();

        foreach ($availableBatches as $batch) {
            if ($remainingQuantity <= 0) break;

            $quantityFromBatch = min($batch->current_quantity, $remainingQuantity);
            
            $batches[] = [
                'batch' => $batch,
                'quantity' => $quantityFromBatch,
                'purchase_price' => $batch->purchase_price,
                'selling_price' => $batch->selling_price,
            ];

            $remainingQuantity -= $quantityFromBatch;
        }

        // Check if we have enough stock
        if ($remainingQuantity > 0) {
            return [
                'success' => false,
                'batches' => $batches,
                'shortage' => $remainingQuantity,
                'message' => "Insufficient stock. Short by {$remainingQuantity} units.",
            ];
        }

        return [
            'success' => true,
            'batches' => $batches,
            'shortage' => 0,
        ];
    }

    /**
     * Calculate weighted average cost for a product
     */
    public function getWeightedAverageCost(string $productId, string $branchId): float
    {
        $batches = InventoryBatch::forProduct($productId)
            ->forBranch($branchId)
            ->active()
            ->where('current_quantity', '>', 0)
            ->get();

        if ($batches->isEmpty()) return 0;

        $totalValue = 0;
        $totalQuantity = 0;

        foreach ($batches as $batch) {
            $totalValue += $batch->purchase_price * $batch->current_quantity;
            $totalQuantity += $batch->current_quantity;
        }

        return $totalQuantity > 0 ? round($totalValue / $totalQuantity, 2) : 0;
    }

    /**
     * Calculate weighted average selling price
     */
    public function getWeightedAverageSellingPrice(string $productId, string $branchId): float
    {
        $batches = InventoryBatch::forProduct($productId)
            ->forBranch($branchId)
            ->active()
            ->where('current_quantity', '>', 0)
            ->get();

        if ($batches->isEmpty()) return 0;

        $totalValue = 0;
        $totalQuantity = 0;

        foreach ($batches as $batch) {
            $totalValue += $batch->selling_price * $batch->current_quantity;
            $totalQuantity += $batch->current_quantity;
        }

        return $totalQuantity > 0 ? round($totalValue / $totalQuantity, 2) : 0;
    }

    /**
     * Get the selling price for POS display (single price for cashier)
     */
    public function getSellingPrice(string $productId, string $branchId): float
    {
        switch ($this->strategy) {
            case 'weighted_average':
                return $this->getWeightedAverageSellingPrice($productId, $branchId);
            
            case 'fefo':
            case 'fifo':
            default:
                // Get price from next batch to be sold
                $nextBatch = $this->getNextBatch($productId, $branchId);
                return $nextBatch ? (float) $nextBatch->selling_price : 0;
        }
    }

    /**
     * Deduct stock from batches (called during sale)
     */
    public function deductStock(string $productId, string $branchId, float $quantity, ?string $transactionId = null): array
    {
        $result = $this->getBatchesForQuantity($productId, $branchId, $quantity);

        if (!$result['success']) {
            return $result;
        }

        DB::beginTransaction();

        try {
            $totalCost = 0;
            $deductions = [];

            foreach ($result['batches'] as $batchInfo) {
                $batch = $batchInfo['batch'];
                $qty = $batchInfo['quantity'];

                // Deduct from batch
                $batch->deductQuantity($qty);

                // Calculate cost for profit tracking
                $totalCost += $batch->purchase_price * $qty;

                // Log the deduction
                POSAuditLog::logAction(
                    $batch->current_quantity <= 0 
                        ? POSAuditLog::ACTION_BATCH_DEPLETED 
                        : POSAuditLog::ACTION_STOCK_ADJUSTMENT,
                    'batch',
                    $batch->id,
                    [
                        'branch_id' => $branchId,
                        'transaction_id' => $transactionId,
                        'old_value' => $batch->current_quantity + $qty,
                        'new_value' => $batch->current_quantity,
                        'details' => [
                            'product_id' => $productId,
                            'quantity_deducted' => $qty,
                            'batch_number' => $batch->batch_number,
                        ],
                    ]
                );

                $deductions[] = [
                    'batch_id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'quantity' => $qty,
                    'purchase_price' => $batch->purchase_price,
                    'selling_price' => $batch->selling_price,
                ];
            }

            DB::commit();

            return [
                'success' => true,
                'deductions' => $deductions,
                'total_cost' => $totalCost,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Failed to deduct stock: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get total available stock for a product at a branch
     */
    public function getTotalStock(string $productId, string $branchId): float
    {
        return InventoryBatch::forProduct($productId)
            ->forBranch($branchId)
            ->active()
            ->sum('current_quantity');
    }

    /**
     * Get stock aging report
     */
    public function getStockAgingReport(string $branchId, int $agingDays = 90): Collection
    {
        return InventoryBatch::forBranch($branchId)
            ->active()
            ->where('received_date', '<', now()->subDays($agingDays))
            ->with('product:id,item_name,item_code')
            ->select([
                'id',
                'product_id',
                'batch_number',
                'current_quantity',
                'purchase_price',
                'received_date',
                'expiry_date',
                DB::raw('DATEDIFF(NOW(), received_date) as days_old'),
                DB::raw('current_quantity * purchase_price as stock_value'),
            ])
            ->orderBy('received_date', 'asc')
            ->get();
    }

    /**
     * Get expiring soon report
     */
    public function getExpiringSoonReport(string $branchId, int $days = 30): Collection
    {
        return InventoryBatch::forBranch($branchId)
            ->expiringSoon($days)
            ->active()
            ->with('product:id,item_name,item_code')
            ->orderBy('expiry_date', 'asc')
            ->get();
    }

    /**
     * Get profit analysis by batch
     */
    public function getBatchProfitAnalysis(string $branchId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = InventoryBatch::forBranch($branchId)
            ->with('product:id,item_name,item_code');

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

        $batches = $query->get();

        $analysis = [
            'total_purchase_value' => 0,
            'total_selling_value' => 0,
            'expected_profit' => 0,
            'average_margin' => 0,
            'batches' => [],
        ];

        foreach ($batches as $batch) {
            $soldQty = $batch->original_quantity - $batch->current_quantity;
            $purchaseValue = $batch->purchase_price * $soldQty;
            $sellingValue = $batch->selling_price * $soldQty;
            $profit = $sellingValue - $purchaseValue;

            $analysis['total_purchase_value'] += $purchaseValue;
            $analysis['total_selling_value'] += $sellingValue;

            $analysis['batches'][] = [
                'batch_id' => $batch->id,
                'batch_number' => $batch->batch_number,
                'product' => $batch->product->item_name ?? 'Unknown',
                'sold_quantity' => $soldQty,
                'purchase_value' => $purchaseValue,
                'selling_value' => $sellingValue,
                'profit' => $profit,
                'margin_percentage' => $purchaseValue > 0 
                    ? round(($profit / $purchaseValue) * 100, 2) 
                    : 0,
            ];
        }

        $analysis['expected_profit'] = $analysis['total_selling_value'] - $analysis['total_purchase_value'];
        $analysis['average_margin'] = $analysis['total_purchase_value'] > 0
            ? round(($analysis['expected_profit'] / $analysis['total_purchase_value']) * 100, 2)
            : 0;

        return $analysis;
    }
}
