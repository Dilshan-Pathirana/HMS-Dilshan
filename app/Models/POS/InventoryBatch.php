<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Pharmacy\Product;
use App\Models\Branch;
use App\Models\Pharmacy\Supplier;
use App\Models\AllUsers\User;
use App\Models\GoodsReceivingNote;

class InventoryBatch extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'inventory_batches';

    protected $fillable = [
        'product_id',
        'branch_id',
        'batch_number',
        'purchase_price',
        'selling_price',
        'original_quantity',
        'current_quantity',
        'supplier_id',
        'received_date',
        'expiry_date',
        'manufacturing_date',
        'status',
        'low_stock_threshold',
        'grn_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'original_quantity' => 'decimal:2',
        'current_quantity' => 'decimal:2',
        'low_stock_threshold' => 'decimal:2',
        'received_date' => 'date',
        'expiry_date' => 'date',
        'manufacturing_date' => 'date',
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

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function grn()
    {
        return $this->belongsTo(GoodsReceivingNote::class, 'grn_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('current_quantity', '>', 0);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeForProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function scopeFifoOrder($query)
    {
        return $query->orderBy('received_date', 'asc')->orderBy('created_at', 'asc');
    }

    public function scopeFefoOrder($query)
    {
        return $query->orderByRaw('CASE WHEN expiry_date IS NULL THEN 1 ELSE 0 END')
                     ->orderBy('expiry_date', 'asc')
                     ->orderBy('received_date', 'asc');
    }

    public function scopeExpiringSoon($query, $days = 30)
    {
        return $query->whereNotNull('expiry_date')
                     ->where('expiry_date', '<=', now()->addDays($days))
                     ->where('expiry_date', '>', now());
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('current_quantity', '<=', 'low_stock_threshold');
    }

    // Helper methods
    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function isLowStock(): bool
    {
        return $this->current_quantity <= $this->low_stock_threshold;
    }

    public function getDaysUntilExpiryAttribute(): ?int
    {
        return $this->expiry_date ? now()->diffInDays($this->expiry_date, false) : null;
    }

    public function getProfitMarginAttribute(): float
    {
        if ($this->purchase_price <= 0) return 0;
        return (($this->selling_price - $this->purchase_price) / $this->purchase_price) * 100;
    }

    /**
     * Deduct quantity from batch
     */
    public function deductQuantity(float $quantity): bool
    {
        if ($quantity > $this->current_quantity) {
            return false;
        }

        $this->current_quantity -= $quantity;
        
        if ($this->current_quantity <= 0) {
            $this->status = 'depleted';
        }

        return $this->save();
    }

    /**
     * Generate unique batch number
     */
    public static function generateBatchNumber(string $productCode, string $branchCode): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(substr(md5(uniqid()), 0, 4));
        return "BT-{$branchCode}-{$productCode}-{$date}-{$random}";
    }
}
