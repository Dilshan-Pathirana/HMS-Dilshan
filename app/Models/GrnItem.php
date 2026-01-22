<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GrnItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'grn_id',
        'purchase_order_item_id',
        'product_id',
        'ordered_quantity',
        'received_quantity',
        'rejected_quantity',
        'damaged_quantity',
        'batch_number',
        'manufacture_date',
        'expiry_date',
        'received_unit_price',
        'line_total',
        'quality_status',
        'rejection_reason',
        'item_notes',
    ];

    protected $casts = [
        'manufacture_date' => 'date',
        'expiry_date' => 'date',
        'received_unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function grn(): BelongsTo
    {
        return $this->belongsTo(GoodsReceivingNote::class, 'grn_id');
    }

    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
