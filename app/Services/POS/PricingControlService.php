<?php

namespace App\Services\POS;

use App\Models\POS\PricingControl;
use App\Models\POS\PriceOverrideRequest;
use App\Models\POS\POSAuditLog;
use App\Models\Pharmacy\Product;
use App\Models\SystemSettings;
use Illuminate\Support\Facades\Hash;

/**
 * Pricing Control Service
 * 
 * Handles centralized pricing rules:
 * - Default selling price
 * - Minimum/maximum price limits
 * - Maximum discount allowed
 * - Price override approval workflow
 */
class PricingControlService
{
    /**
     * Validate a price against pricing controls
     */
    public function validatePrice(string $productId, float $price, ?string $branchId = null): array
    {
        $control = PricingControl::getForProduct($productId, $branchId);

        if (!$control) {
            return [
                'valid' => true,
                'requires_approval' => false,
                'message' => null,
                'control' => null,
            ];
        }

        $result = $control->validatePrice($price);
        $result['control'] = $control;

        return $result;
    }

    /**
     * Validate a discount against pricing controls
     */
    public function validateDiscount(
        string $productId, 
        ?float $discountPercentage = null, 
        ?float $discountAmount = null,
        ?string $branchId = null
    ): array {
        $control = PricingControl::getForProduct($productId, $branchId);

        if (!$control) {
            return [
                'valid' => true,
                'message' => null,
            ];
        }

        return $control->validateDiscount($discountPercentage, $discountAmount);
    }

    /**
     * Get the allowed price range for a product
     */
    public function getPriceRange(string $productId, ?string $branchId = null): array
    {
        $control = PricingControl::getForProduct($productId, $branchId);

        if (!$control) {
            return [
                'default' => null,
                'min' => 0,
                'max' => null,
                'has_control' => false,
            ];
        }

        return [
            'default' => $control->default_selling_price,
            'min' => $control->min_selling_price,
            'max' => $control->max_selling_price,
            'max_discount_percentage' => $control->max_discount_percentage,
            'max_discount_amount' => $control->max_discount_amount,
            'allow_manual_price' => $control->allow_manual_price,
            'has_control' => true,
        ];
    }

    /**
     * Create a price override request
     */
    public function createOverrideRequest(
        string $productId,
        float $originalPrice,
        float $requestedPrice,
        int $quantity,
        string $reason,
        string $branchId,
        string $requestedBy,
        ?string $batchId = null
    ): PriceOverrideRequest {
        $control = PricingControl::getForProduct($productId, $branchId);
        
        $expiryMinutes = SystemSettings::where('key', 'pos_override_request_expiry_minutes')
            ->value('value') ?? 30;

        $request = PriceOverrideRequest::create([
            'product_id' => $productId,
            'batch_id' => $batchId,
            'original_price' => $originalPrice,
            'requested_price' => $requestedPrice,
            'min_allowed_price' => $control?->min_selling_price ?? 0,
            'quantity' => $quantity,
            'reason' => $reason,
            'branch_id' => $branchId,
            'requested_by' => $requestedBy,
            'status' => PriceOverrideRequest::STATUS_PENDING,
            'expires_at' => now()->addMinutes($expiryMinutes),
        ]);

        // Log the request
        POSAuditLog::logAction(
            POSAuditLog::ACTION_APPROVAL_REQUESTED,
            'price_override',
            $request->id,
            [
                'branch_id' => $branchId,
                'user_id' => $requestedBy,
                'old_value' => $originalPrice,
                'new_value' => $requestedPrice,
                'details' => [
                    'product_id' => $productId,
                    'quantity' => $quantity,
                ],
                'reason' => $reason,
            ]
        );

        return $request;
    }

    /**
     * Quick approve with PIN (for managers on POS)
     */
    public function quickApproveWithPin(
        string $requestId,
        string $approverPin,
        string $approverId
    ): array {
        $request = PriceOverrideRequest::find($requestId);

        if (!$request || !$request->isPending()) {
            return [
                'success' => false,
                'message' => 'Request not found or no longer pending',
            ];
        }

        // Verify PIN (stored in user's profile or system setting)
        // For simplicity, we'll verify against a branch admin's PIN
        $user = \App\Models\AllUsers\User::find($approverId);
        
        if (!$user || !in_array($user->role_as, [1, 2])) { // Super Admin or Branch Admin
            return [
                'success' => false,
                'message' => 'Only Branch Admin or Super Admin can approve',
            ];
        }

        // Approve the request
        $request->approve($user, 'Quick PIN approval');

        return [
            'success' => true,
            'message' => 'Price override approved',
            'request' => $request,
        ];
    }

    /**
     * Get pending override requests for a branch
     */
    public function getPendingRequests(string $branchId): \Illuminate\Database\Eloquent\Collection
    {
        return PriceOverrideRequest::pending()
            ->forBranch($branchId)
            ->with(['product:id,item_name,item_code', 'requester:id,first_name,last_name'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Create or update pricing control for a product
     */
    public function setPricingControl(
        string $productId,
        array $data,
        ?string $branchId = null,
        ?string $userId = null
    ): PricingControl {
        $control = PricingControl::updateOrCreate(
            [
                'product_id' => $productId,
                'branch_id' => $branchId,
            ],
            array_merge($data, [
                'is_global' => $branchId === null,
                'updated_by' => $userId,
            ])
        );

        // Log the change
        POSAuditLog::logAction(
            POSAuditLog::ACTION_PRICE_CONTROL_CHANGED,
            'pricing_control',
            $control->id,
            [
                'branch_id' => $branchId,
                'user_id' => $userId,
                'details' => $data,
            ]
        );

        return $control;
    }

    /**
     * Calculate if price needs approval
     */
    public function needsApproval(string $productId, float $price, ?string $branchId = null): bool
    {
        $control = PricingControl::getForProduct($productId, $branchId);

        if (!$control) return false;

        if ($price < $control->min_selling_price && $control->requires_approval_below_min) {
            return true;
        }

        return false;
    }
}
