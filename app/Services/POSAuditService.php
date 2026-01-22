<?php

namespace App\Services;

use App\Models\ChangeLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * POS Audit Logger Service
 * 
 * Provides simplified audit logging for POS-related actions
 * Tracks: User ID, Branch, Transaction ID, Action, Timestamp
 */
class POSAuditService
{
    // Module constants
    const MODULE_POS = 'pos';
    const MODULE_EOD = 'eod';
    const MODULE_INVENTORY = 'inventory';
    const MODULE_CASHIER = 'cashier';
    const MODULE_PHARMACY = 'pharmacy';
    const MODULE_REPORTS = 'reports';

    // Action constants
    const ACTION_CREATE = 'create';
    const ACTION_UPDATE = 'update';
    const ACTION_DELETE = 'delete';
    const ACTION_VOID = 'void';
    const ACTION_APPROVE = 'approve';
    const ACTION_REJECT = 'reject';
    const ACTION_FLAG = 'flag';
    const ACTION_PRINT = 'print';
    const ACTION_EXPORT = 'export';
    const ACTION_LOGIN = 'login';
    const ACTION_LOGOUT = 'logout';
    const ACTION_REFUND = 'refund';
    const ACTION_DISCOUNT = 'discount';
    const ACTION_STOCK_ADJUST = 'stock_adjust';
    const ACTION_EOD_SUBMIT = 'eod_submit';
    const ACTION_EOD_APPROVE = 'eod_approve';
    const ACTION_EOD_REJECT = 'eod_reject';
    const ACTION_EOD_FLAG = 'eod_flag';
    const ACTION_DRAWER_OPEN = 'drawer_open';
    const ACTION_DRAWER_CLOSE = 'drawer_close';

    // Severity constants
    const SEVERITY_INFO = 'info';
    const SEVERITY_WARNING = 'warning';
    const SEVERITY_CRITICAL = 'critical';

    /**
     * Log a POS action
     */
    public static function log(
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?int $transactionId = null,
        array $data = [],
        string $module = self::MODULE_POS,
        string $severity = self::SEVERITY_INFO
    ): ?ChangeLog {
        try {
            $user = Auth::user();
            
            return ChangeLog::create([
                'user_id' => $user ? $user->id : null,
                'branch_id' => $user ? $user->branch_id : null,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'transaction_id' => $transactionId,
                'action' => $action,
                'module' => $module,
                'severity' => $severity,
                'before_data' => $data['before'] ?? null,
                'after_data' => $data['after'] ?? null,
                'changes' => $data['changes'] ?? null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('POSAuditService log error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log transaction creation
     */
    public static function logTransaction(
        string|int $transactionId,
        array $transactionData,
        string|int|null $branchId = null
    ): ?ChangeLog {
        $user = Auth::user();
        
        try {
            return ChangeLog::create([
                'user_id' => $user ? $user->id : null,
                'branch_id' => $branchId ?? ($user ? $user->branch_id : null),
                'entity_type' => 'billing_transaction',
                'entity_id' => $transactionId,
                'transaction_id' => $transactionId,
                'action' => self::ACTION_CREATE,
                'module' => self::MODULE_POS,
                'severity' => self::SEVERITY_INFO,
                'after_data' => $transactionData,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('POSAuditService logTransaction error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log transaction void/refund
     */
    public static function logVoidRefund(
        int $transactionId,
        string $action, // 'void' or 'refund'
        array $beforeData,
        array $afterData,
        string $reason,
        ?int $branchId = null
    ): ?ChangeLog {
        $user = Auth::user();
        
        try {
            return ChangeLog::create([
                'user_id' => $user ? $user->id : null,
                'branch_id' => $branchId ?? ($user ? $user->branch_id : null),
                'entity_type' => 'billing_transaction',
                'entity_id' => $transactionId,
                'transaction_id' => $transactionId,
                'action' => $action,
                'module' => self::MODULE_POS,
                'severity' => self::SEVERITY_WARNING,
                'before_data' => $beforeData,
                'after_data' => $afterData,
                'changes' => ['reason' => $reason],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('POSAuditService logVoidRefund error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log EOD submission
     */
    public static function logEODSubmit(
        int $eodReportId,
        array $eodData,
        ?int $branchId = null
    ): ?ChangeLog {
        $user = Auth::user();
        
        try {
            return ChangeLog::create([
                'user_id' => $user ? $user->id : null,
                'branch_id' => $branchId ?? ($user ? $user->branch_id : null),
                'entity_type' => 'eod_report',
                'entity_id' => $eodReportId,
                'action' => self::ACTION_EOD_SUBMIT,
                'module' => self::MODULE_EOD,
                'severity' => self::SEVERITY_INFO,
                'after_data' => $eodData,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('POSAuditService logEODSubmit error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log EOD approval/rejection/flag
     */
    public static function logEODReview(
        int $eodReportId,
        string $action, // 'eod_approve', 'eod_reject', 'eod_flag'
        array $beforeData,
        array $afterData,
        ?string $reason = null,
        ?int $branchId = null
    ): ?ChangeLog {
        $user = Auth::user();
        $severity = $action === self::ACTION_EOD_APPROVE ? self::SEVERITY_INFO : self::SEVERITY_WARNING;
        
        try {
            return ChangeLog::create([
                'user_id' => $user ? $user->id : null,
                'branch_id' => $branchId ?? ($user ? $user->branch_id : null),
                'entity_type' => 'eod_report',
                'entity_id' => $eodReportId,
                'action' => $action,
                'module' => self::MODULE_EOD,
                'severity' => $severity,
                'before_data' => $beforeData,
                'after_data' => $afterData,
                'changes' => $reason ? ['reason' => $reason] : null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('POSAuditService logEODReview error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log stock adjustment
     */
    public static function logStockAdjustment(
        int $productId,
        int $beforeStock,
        int $afterStock,
        string $reason,
        ?int $transactionId = null,
        ?int $branchId = null
    ): ?ChangeLog {
        $user = Auth::user();
        
        try {
            return ChangeLog::create([
                'user_id' => $user ? $user->id : null,
                'branch_id' => $branchId ?? ($user ? $user->branch_id : null),
                'entity_type' => 'product_stock',
                'entity_id' => $productId,
                'transaction_id' => $transactionId,
                'action' => self::ACTION_STOCK_ADJUST,
                'module' => self::MODULE_INVENTORY,
                'severity' => self::SEVERITY_INFO,
                'before_data' => ['stock' => $beforeStock],
                'after_data' => ['stock' => $afterStock],
                'changes' => [
                    'reason' => $reason,
                    'quantity_changed' => $afterStock - $beforeStock,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('POSAuditService logStockAdjustment error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log discount application
     */
    public static function logDiscount(
        int $transactionId,
        float $discountAmount,
        string $discountType,
        ?string $reason = null,
        ?int $branchId = null
    ): ?ChangeLog {
        $user = Auth::user();
        
        try {
            return ChangeLog::create([
                'user_id' => $user ? $user->id : null,
                'branch_id' => $branchId ?? ($user ? $user->branch_id : null),
                'entity_type' => 'billing_transaction',
                'entity_id' => $transactionId,
                'transaction_id' => $transactionId,
                'action' => self::ACTION_DISCOUNT,
                'module' => self::MODULE_POS,
                'severity' => self::SEVERITY_INFO,
                'after_data' => [
                    'discount_amount' => $discountAmount,
                    'discount_type' => $discountType,
                    'reason' => $reason,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('POSAuditService logDiscount error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log cash drawer operations
     */
    public static function logDrawerOperation(
        string $action, // 'drawer_open' or 'drawer_close'
        ?float $amount = null,
        ?string $reason = null,
        ?int $branchId = null
    ): ?ChangeLog {
        $user = Auth::user();
        
        try {
            return ChangeLog::create([
                'user_id' => $user ? $user->id : null,
                'branch_id' => $branchId ?? ($user ? $user->branch_id : null),
                'entity_type' => 'cash_drawer',
                'entity_id' => null,
                'action' => $action,
                'module' => self::MODULE_CASHIER,
                'severity' => self::SEVERITY_INFO,
                'after_data' => [
                    'amount' => $amount,
                    'reason' => $reason,
                    'timestamp' => now()->toIso8601String(),
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('POSAuditService logDrawerOperation error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log report generation/export
     */
    public static function logReportAccess(
        string $reportType,
        array $parameters = [],
        string $action = self::ACTION_EXPORT,
        ?int $branchId = null
    ): ?ChangeLog {
        $user = Auth::user();
        
        try {
            return ChangeLog::create([
                'user_id' => $user ? $user->id : null,
                'branch_id' => $branchId ?? ($user ? $user->branch_id : null),
                'entity_type' => 'report',
                'entity_id' => null,
                'action' => $action,
                'module' => self::MODULE_REPORTS,
                'severity' => self::SEVERITY_INFO,
                'after_data' => [
                    'report_type' => $reportType,
                    'parameters' => $parameters,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('POSAuditService logReportAccess error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get audit logs with filters
     */
    public static function getLogs(array $filters = [], int $perPage = 50)
    {
        $query = ChangeLog::with(['user', 'branch'])
            ->orderBy('created_at', 'desc');

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }

        if (!empty($filters['module'])) {
            $query->where('module', $filters['module']);
        }

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['entity_type'])) {
            $query->where('entity_type', $filters['entity_type']);
        }

        if (!empty($filters['severity'])) {
            $query->where('severity', $filters['severity']);
        }

        if (!empty($filters['transaction_id'])) {
            $query->where('transaction_id', $filters['transaction_id']);
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('entity_type', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Get transaction history (all logs for a specific transaction)
     */
    public static function getTransactionHistory(int $transactionId)
    {
        return ChangeLog::with(['user', 'branch'])
            ->where('transaction_id', $transactionId)
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Get user activity (all logs for a specific user)
     */
    public static function getUserActivity(int $userId, int $limit = 100)
    {
        return ChangeLog::with(['branch'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
