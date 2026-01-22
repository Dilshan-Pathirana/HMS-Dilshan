<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Pharmacy\Product;
use App\Models\Branch;
use App\Models\AllUsers\User;

class PricingControl extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pricing_controls';

    protected $fillable = [
        'product_id',
        'default_selling_price',
        'min_selling_price',
        'max_selling_price',
        'max_discount_percentage',
        'max_discount_amount',
        'min_margin_percentage',
        'allow_manual_price',
        'requires_approval_below_min',
        'branch_id',
        'is_global',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'default_selling_price' => 'decimal:2',
        'min_selling_price' => 'decimal:2',
        'max_selling_price' => 'decimal:2',
        'max_discount_percentage' => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'min_margin_percentage' => 'decimal:2',
        'allow_manual_price' => 'boolean',
        'requires_approval_below_min' => 'boolean',
        'is_global' => 'boolean',
    ];

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
    public function scopeForProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where(function ($q) use ($branchId) {
            $q->where('branch_id', $branchId)
              ->orWhere('is_global', true);
        });
    }

    public function scopeGlobal($query)
    {
        return $query->where('is_global', true);
    }

    // Static helpers
    /**
     * Get pricing control for a product in a branch
     * Priority: Branch-specific > Global
     */
    public static function getForProduct($productId, $branchId = null)
    {
        // Try branch-specific first
        if ($branchId) {
            $branchControl = self::where('product_id', $productId)
                                 ->where('branch_id', $branchId)
                                 ->first();
            
            if ($branchControl) return $branchControl;
        }

        // Fall back to global
        return self::where('product_id', $productId)
                   ->where('is_global', true)
                   ->first();
    }

    // Validation methods
    public function validatePrice(float $price): array
    {
        $result = [
            'valid' => true,
            'requires_approval' => false,
            'message' => null,
        ];

        if ($price < $this->min_selling_price) {
            $result['valid'] = false;
            $result['requires_approval'] = $this->requires_approval_below_min;
            $result['message'] = "Price is below minimum allowed (Rs. {$this->min_selling_price})";
        }

        if ($this->max_selling_price && $price > $this->max_selling_price) {
            $result['valid'] = false;
            $result['message'] = "Price exceeds maximum allowed (Rs. {$this->max_selling_price})";
        }

        return $result;
    }

    public function validateDiscount(float $discountPercentage = null, float $discountAmount = null): array
    {
        $result = [
            'valid' => true,
            'message' => null,
        ];

        if ($discountPercentage !== null && $discountPercentage > $this->max_discount_percentage) {
            $result['valid'] = false;
            $result['message'] = "Discount exceeds maximum allowed ({$this->max_discount_percentage}%)";
        }

        if ($discountAmount !== null && $this->max_discount_amount && $discountAmount > $this->max_discount_amount) {
            $result['valid'] = false;
            $result['message'] = "Discount amount exceeds maximum allowed (Rs. {$this->max_discount_amount})";
        }

        return $result;
    }

    public function getMaxAllowedDiscount(float $originalPrice): float
    {
        $percentageDiscount = $originalPrice * ($this->max_discount_percentage / 100);
        
        if ($this->max_discount_amount) {
            return min($percentageDiscount, $this->max_discount_amount);
        }

        return $percentageDiscount;
    }
}
