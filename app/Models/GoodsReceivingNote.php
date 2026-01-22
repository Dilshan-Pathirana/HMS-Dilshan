<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GoodsReceivingNote extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'grn_number',
        'purchase_order_id',
        'branch_id',
        'pharmacy_id',
        'received_by',
        'received_date',
        'supplier_invoice_number',
        'supplier_invoice_date',
        'delivery_note_number',
        'status',
        'total_received_value',
        'remarks',
        'has_discrepancies',
        'discrepancy_notes',
    ];

    protected $casts = [
        'received_date' => 'date',
        'supplier_invoice_date' => 'date',
        'total_received_value' => 'decimal:2',
        'has_discrepancies' => 'boolean',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(GrnItem::class, 'grn_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(SupplierInvoice::class, 'grn_id');
    }

    public static function generateGRNNumber(): string
    {
        $date = now()->format('ymd');
        $latest = self::where('grn_number', 'like', "GRN-{$date}-%")->latest('created_at')->first();
        
        if ($latest) {
            $lastNumber = (int) substr($latest->grn_number, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }
        
        return "GRN-{$date}-{$newNumber}";
    }
}
