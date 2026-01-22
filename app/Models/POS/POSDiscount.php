<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Pharmacy\Product;
use App\Models\Branch;
use App\Models\AllUsers\User;

class POSDiscount extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pos_discounts';

    protected $fillable = [
        'name',
        'code',
        'description',
        'scope',
        'type',
        'value',
        'product_id',
        'category',
        'valid_from',
        'valid_until',
        'is_period_based',
        'min_purchase_amount',
        'min_quantity',
        'max_discount_amount',
        'branch_id',
        'is_global',
        'cashier_can_apply',
        'requires_approval',
        'priority',
        'can_stack',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_purchase_amount' => 'decimal:2',
        'min_quantity' => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_period_based' => 'boolean',
        'is_global' => 'boolean',
        'cashier_can_apply' => 'boolean',
        'requires_approval' => 'boolean',
        'can_stack' => 'boolean',
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    // Scope constants
    const SCOPE_ITEM = 'item';
    const SCOPE_CATEGORY = 'category';
    const SCOPE_BILL = 'bill';

    // Type constants
    const TYPE_PERCENTAGE = 'percentage';
    const TYPE_FIXED = 'fixed';

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeValid($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('valid_from')
              ->orWhere('valid_from', '<=', now());
        })->where(function ($q) {
            $q->whereNull('valid_until')
              ->orWhere('valid_until', '>=', now());
        });
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where(function ($q) use ($branchId) {
            $q->where('branch_id', $branchId)
              ->orWhere('is_global', true);
        });
    }

    public function scopeForProduct($query, $productId)
    {
        return $query->where('scope', self::SCOPE_ITEM)
                     ->where('product_id', $productId);
    }

    public function scopeForCategory($query, $category)
    {
        return $query->where('scope', self::SCOPE_CATEGORY)
                     ->where('category', $category);
    }

    public function scopeBillLevel($query)
    {
        return $query->where('scope', self::SCOPE_BILL);
    }

    public function scopeItemLevel($query)
    {
        return $query->where('scope', self::SCOPE_ITEM);
    }

    public function scopeCashierAllowed($query)
    {
        return $query->where('cashier_can_apply', true);
    }

    public function scopeByPriority($query)
    {
        return $query->orderBy('priority', 'asc');
    }

    // Helper methods
    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        
        if ($this->valid_from && $this->valid_from->isFuture()) return false;
        if ($this->valid_until && $this->valid_until->isPast()) return false;
        
        return true;
    }

    public function calculateDiscount(float $amount, float $quantity = 1): float
    {
        if (!$this->isValid()) return 0;

        // Check minimum conditions
        if ($this->min_purchase_amount && $amount < $this->min_purchase_amount) return 0;
        if ($this->min_quantity && $quantity < $this->min_quantity) return 0;

        $discount = 0;

        if ($this->type === self::TYPE_PERCENTAGE) {
            $discount = $amount * ($this->value / 100);
        } else {
            $discount = $this->value;
        }

        // Apply cap if set
        if ($this->max_discount_amount && $discount > $this->max_discount_amount) {
            $discount = $this->max_discount_amount;
        }

        // Don't discount more than the amount
        return min($discount, $amount);
    }

    /**
     * Get all applicable discounts for a product
     */
    public static function getApplicableForProduct($productId, $branchId, $category = null, $isCashier = true)
    {
        $query = self::active()
            ->valid()
            ->forBranch($branchId)
            ->byPriority();

        if ($isCashier) {
            $query->cashierAllowed();
        }

        return $query->where(function ($q) use ($productId, $category) {
            $q->where(function ($sq) use ($productId) {
                $sq->where('scope', self::SCOPE_ITEM)
                   ->where('product_id', $productId);
            })->orWhere(function ($sq) use ($category) {
                $sq->where('scope', self::SCOPE_CATEGORY)
                   ->where('category', $category);
            });
        })->get();
    }

    /**
     * Get all applicable bill-level discounts
     */
    public static function getApplicableForBill($branchId, $billAmount, $isCashier = true)
    {
        $query = self::active()
            ->valid()
            ->forBranch($branchId)
            ->billLevel()
            ->byPriority();

        if ($isCashier) {
            $query->cashierAllowed();
        }

        return $query->where(function ($q) use ($billAmount) {
            $q->whereNull('min_purchase_amount')
              ->orWhere('min_purchase_amount', '<=', $billAmount);
        })->get();
    }
}
