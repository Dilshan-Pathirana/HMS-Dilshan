<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Branch;
use App\Models\AllUsers\User;

class POSAuditLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pos_audit_logs';

    protected $fillable = [
        'action_type',
        'entity_type',
        'entity_id',
        'transaction_id',
        'branch_id',
        'user_id',
        'user_role',
        'approved_by',
        'approved_at',
        'old_value',
        'new_value',
        'amount_impact',
        'details',
        'reason',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_value' => 'decimal:2',
        'new_value' => 'decimal:2',
        'amount_impact' => 'decimal:2',
        'details' => 'array',
        'approved_at' => 'datetime',
        'user_role' => 'integer',
    ];

    // Action type constants
    const ACTION_PRICE_OVERRIDE = 'price_override';
    const ACTION_DISCOUNT_APPLIED = 'discount_applied';
    const ACTION_DISCOUNT_CREATED = 'discount_created';
    const ACTION_DISCOUNT_MODIFIED = 'discount_modified';
    const ACTION_STOCK_ADJUSTMENT = 'stock_adjustment';
    const ACTION_BATCH_CREATED = 'batch_created';
    const ACTION_BATCH_DEPLETED = 'batch_depleted';
    const ACTION_SALE_COMPLETED = 'sale_completed';
    const ACTION_SALE_VOIDED = 'sale_voided';
    const ACTION_REFUND_PROCESSED = 'refund_processed';
    const ACTION_PRICE_CONTROL_CHANGED = 'price_control_changed';
    const ACTION_MANUAL_PRICE_ENTRY = 'manual_price_entry';
    const ACTION_APPROVAL_REQUESTED = 'approval_requested';
    const ACTION_APPROVAL_GRANTED = 'approval_granted';
    const ACTION_APPROVAL_DENIED = 'approval_denied';

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeOfType($query, $actionType)
    {
        return $query->where('action_type', $actionType);
    }

    public function scopeForEntity($query, $entityType, $entityId = null)
    {
        $query->where('entity_type', $entityType);
        
        if ($entityId) {
            $query->where('entity_id', $entityId);
        }

        return $query;
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    // Static factory methods
    public static function logAction(
        string $actionType,
        string $entityType,
        string $entityId,
        array $options = []
    ): self {
        return self::create([
            'action_type' => $actionType,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'transaction_id' => $options['transaction_id'] ?? null,
            'branch_id' => $options['branch_id'] ?? null,
            'user_id' => $options['user_id'] ?? auth()->id(),
            'user_role' => $options['user_role'] ?? auth()->user()?->role_as,
            'approved_by' => $options['approved_by'] ?? null,
            'approved_at' => $options['approved_at'] ?? null,
            'old_value' => $options['old_value'] ?? null,
            'new_value' => $options['new_value'] ?? null,
            'amount_impact' => $options['amount_impact'] ?? null,
            'details' => $options['details'] ?? null,
            'reason' => $options['reason'] ?? null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    // Reporting helpers
    public static function getDiscountImpactReport($branchId = null, $startDate = null, $endDate = null)
    {
        $query = self::ofType(self::ACTION_DISCOUNT_APPLIED);

        if ($branchId) $query->forBranch($branchId);
        if ($startDate && $endDate) $query->inDateRange($startDate, $endDate);

        return $query->selectRaw('
            COUNT(*) as total_applications,
            SUM(amount_impact) as total_discount_given,
            AVG(amount_impact) as avg_discount,
            DATE(created_at) as date
        ')
        ->groupBy('date')
        ->orderBy('date', 'desc')
        ->get();
    }

    public static function getPriceOverrideReport($branchId = null, $startDate = null, $endDate = null)
    {
        $query = self::ofType(self::ACTION_PRICE_OVERRIDE);

        if ($branchId) $query->forBranch($branchId);
        if ($startDate && $endDate) $query->inDateRange($startDate, $endDate);

        return $query->with(['user:id,first_name,last_name', 'approver:id,first_name,last_name'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
