<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Pharmacy\Product;
use App\Models\Branch;
use App\Models\AllUsers\User;

class PriceOverrideRequest extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'price_override_requests';

    protected $fillable = [
        'pending_transaction_id',
        'transaction_id',
        'product_id',
        'batch_id',
        'original_price',
        'requested_price',
        'min_allowed_price',
        'quantity',
        'reason',
        'branch_id',
        'requested_by',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
        'approval_pin_hash',
        'expires_at',
    ];

    protected $casts = [
        'original_price' => 'decimal:2',
        'requested_price' => 'decimal:2',
        'min_allowed_price' => 'decimal:2',
        'quantity' => 'integer',
        'reviewed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_DENIED = 'denied';
    const STATUS_EXPIRED = 'expired';

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function batch()
    {
        return $this->belongsTo(InventoryBatch::class, 'batch_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING)
                     ->where(function ($q) {
                         $q->whereNull('expires_at')
                           ->orWhere('expires_at', '>', now());
                     });
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeForRequester($query, $userId)
    {
        return $query->where('requested_by', $userId);
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING && !$this->isExpired();
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function approve(User $approver, ?string $notes = null): bool
    {
        if (!$this->isPending()) return false;

        $this->status = self::STATUS_APPROVED;
        $this->reviewed_by = $approver->id;
        $this->reviewed_at = now();
        $this->review_notes = $notes;

        // Log the approval
        POSAuditLog::logAction(
            POSAuditLog::ACTION_APPROVAL_GRANTED,
            'price_override',
            $this->id,
            [
                'branch_id' => $this->branch_id,
                'user_id' => $approver->id,
                'old_value' => $this->original_price,
                'new_value' => $this->requested_price,
                'amount_impact' => ($this->original_price - $this->requested_price) * $this->quantity,
                'details' => [
                    'product_id' => $this->product_id,
                    'quantity' => $this->quantity,
                    'requested_by' => $this->requested_by,
                ],
                'reason' => $notes,
            ]
        );

        return $this->save();
    }

    public function deny(User $reviewer, ?string $notes = null): bool
    {
        if (!$this->isPending()) return false;

        $this->status = self::STATUS_DENIED;
        $this->reviewed_by = $reviewer->id;
        $this->reviewed_at = now();
        $this->review_notes = $notes;

        // Log the denial
        POSAuditLog::logAction(
            POSAuditLog::ACTION_APPROVAL_DENIED,
            'price_override',
            $this->id,
            [
                'branch_id' => $this->branch_id,
                'user_id' => $reviewer->id,
                'old_value' => $this->original_price,
                'new_value' => $this->requested_price,
                'details' => [
                    'product_id' => $this->product_id,
                    'quantity' => $this->quantity,
                    'requested_by' => $this->requested_by,
                ],
                'reason' => $notes,
            ]
        );

        return $this->save();
    }

    /**
     * Verify approval PIN
     */
    public function verifyPin(string $pin): bool
    {
        if (!$this->approval_pin_hash) return false;
        return password_verify($pin, $this->approval_pin_hash);
    }

    /**
     * Get price difference
     */
    public function getPriceDifferenceAttribute(): float
    {
        return $this->original_price - $this->requested_price;
    }

    /**
     * Get total impact
     */
    public function getTotalImpactAttribute(): float
    {
        return $this->price_difference * $this->quantity;
    }
}
