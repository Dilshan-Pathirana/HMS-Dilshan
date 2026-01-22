<?php

namespace App\Models;

use App\Models\Pharmacy\Product;
use App\Models\Pharmacy\Supplier;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequestItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'purchase_request_id',
        'product_id',
        'supplier_id',
        'requested_quantity',
        'suggested_quantity',
        'estimated_unit_price',
        'total_estimated_cost',
        'item_remarks',
        'is_suggested',
        'suggestion_reason',
    ];

    protected $casts = [
        'estimated_unit_price' => 'decimal:2',
        'total_estimated_cost' => 'decimal:2',
        'is_suggested' => 'boolean',
    ];

    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
