<?php

namespace App\Models;

use App\Models\AllUsers\User;
use App\Models\Pharmacy\Supplier;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseRequest extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'pr_number',
        'branch_id',
        'pharmacy_id',
        'supplier_id',
        'created_by',
        'priority',
        'status',
        'general_remarks',
        'total_estimated_cost',
        'total_items',
        'approved_by',
        'approval_remarks',
        'approved_at',
        'rejected_by',
        'rejection_reason',
        'rejected_at',
    ];

    protected $casts = [
        'total_estimated_cost' => 'decimal:2',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Pharmacy\Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public static function generatePRNumber(): string
    {
        $date = now()->format('ymd');
        $latest = self::where('pr_number', 'like', "PR-{$date}-%")->latest('created_at')->first();
        
        if ($latest) {
            $lastNumber = (int) substr($latest->pr_number, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }
        
        return "PR-{$date}-{$newNumber}";
    }
}
