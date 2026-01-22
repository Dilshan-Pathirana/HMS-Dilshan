<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Pharmacy\Product;
use App\Models\AllUsers\User;
use App\Models\Cashier\BillingTransaction;

class TransactionDiscount extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'transaction_discounts';

    protected $fillable = [
        'transaction_id',
        'discount_id',
        'applied_to',
        'product_id',
        'item_index',
        'discount_type',
        'discount_value',
        'discount_amount',
        'original_amount',
        'final_amount',
        'required_approval',
        'approved_by',
        'applied_by',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'original_amount' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'required_approval' => 'boolean',
        'item_index' => 'integer',
    ];

    // Applied to constants
    const APPLIED_TO_ITEM = 'item';
    const APPLIED_TO_BILL = 'bill';

    // Type constants
    const TYPE_PERCENTAGE = 'percentage';
    const TYPE_FIXED = 'fixed';

    // Relationships
    public function transaction()
    {
        return $this->belongsTo(BillingTransaction::class, 'transaction_id');
    }

    public function discount()
    {
        return $this->belongsTo(POSDiscount::class, 'discount_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function applier()
    {
        return $this->belongsTo(User::class, 'applied_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopeForTransaction($query, $transactionId)
    {
        return $query->where('transaction_id', $transactionId);
    }

    public function scopeItemDiscounts($query)
    {
        return $query->where('applied_to', self::APPLIED_TO_ITEM);
    }

    public function scopeBillDiscounts($query)
    {
        return $query->where('applied_to', self::APPLIED_TO_BILL);
    }

    // Helper methods
    public function getSavingsPercentageAttribute(): float
    {
        if ($this->original_amount <= 0) return 0;
        return ($this->discount_amount / $this->original_amount) * 100;
    }
}
