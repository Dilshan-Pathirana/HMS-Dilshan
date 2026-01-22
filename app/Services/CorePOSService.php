<?php

namespace App\Services;

use App\Models\Cashier\BillingTransaction;
use App\Models\Cashier\TransactionItem;
use App\Models\AllUsers\User;
use App\Models\Branch;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

/**
 * Core POS Service
 * 
 * Consolidates all POS transaction logic into a single service.
 * Used by CashierBillingController, BranchAdminPOSController, and SuperAdminPOSController.
 * 
 * This ensures:
 * 1. Consistent transaction creation logic
 * 2. Single source of truth for business rules
 * 3. Uniform validation and stock management
 * 4. Centralized low stock alert generation
 */
class CorePOSService
{
    /**
     * Create a POS transaction
     * 
     * @param array $data Transaction data
     * @param int $branchId The branch ID for the transaction
     * @param int $cashierId The cashier/user creating the transaction
     * @param string $createdByRole Role of the user creating (cashier, branch_admin, super_admin)
     * @return array Result with success status, transaction, and any warnings
     */
    public function createTransaction(array $data, int $branchId, int $cashierId, string $createdByRole = 'cashier'): array
    {
        $result = [
            'success' => false,
            'transaction' => null,
            'low_stock_warning' => [],
            'errors' => [],
        ];

        try {
            DB::beginTransaction();

            // Validate branch exists
            $branch = Branch::find($branchId);
            if (!$branch) {
                throw new \Exception('Branch not found');
            }

            // Calculate totals
            $subtotal = $data['subtotal'] ?? 0;
            $discount = $data['discount'] ?? 0;
            $tax = $data['tax'] ?? 0;
            $totalAmount = $data['total_amount'] ?? ($subtotal - $discount + $tax);
            $paidAmount = $data['paid_amount'] ?? $totalAmount;
            $changeAmount = max(0, $paidAmount - $totalAmount);

            // Generate invoice and receipt numbers
            $invoiceNumber = $this->generateInvoiceNumber($branchId);
            $receiptNumber = $this->generateReceiptNumber($branchId);

            // Create transaction
            $transaction = BillingTransaction::create([
                'branch_id' => $branchId,
                'cashier_id' => $cashierId,
                'transaction_type' => $data['transaction_type'] ?? 'OPD',
                'invoice_number' => $invoiceNumber,
                'receipt_number' => $receiptNumber,
                'patient_name' => $data['patient_name'] ?? 'Walk-in Customer',
                'patient_phone' => $data['patient_phone'] ?? null,
                'patient_id' => $data['patient_id'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total_amount' => $totalAmount,
                'payment_method' => strtoupper($data['payment_method'] ?? 'CASH'),
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'status' => $data['status'] ?? 'COMPLETED',
                'remarks' => $data['remarks'] ?? null,
                'created_by_role' => $createdByRole,
            ]);

            // Process items and update stock
            $lowStockItems = [];
            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    // Create transaction item
                    TransactionItem::create([
                        'transaction_id' => $transaction->id,
                        'item_name' => $item['item_name'] ?? $item['service'] ?? 'Unknown Item',
                        'item_code' => $item['item_code'] ?? $item['product_id'] ?? null,
                        'quantity' => $item['quantity'] ?? 1,
                        'unit_price' => $item['unit_price'] ?? $item['amount'] ?? 0,
                        'total_price' => ($item['unit_price'] ?? $item['amount'] ?? 0) * ($item['quantity'] ?? 1),
                        'product_id' => $item['product_id'] ?? null,
                    ]);

                    // Update stock if product_id exists
                    if (!empty($item['product_id'])) {
                        $stockResult = $this->decrementStock(
                            $item['product_id'],
                            $branchId,
                            $item['quantity'] ?? 1
                        );

                        if ($stockResult['is_low_stock']) {
                            $lowStockItems[] = $stockResult['stock_info'];
                        }
                    }
                }
            }

            // Generate low stock notifications if any
            if (!empty($lowStockItems)) {
                $this->createLowStockNotifications($lowStockItems, $branchId);
            }

            // Update daily summary
            $this->updateDailySummary($branchId, $cashierId, $paidAmount, $data['payment_method'] ?? 'CASH');

            DB::commit();

            // Audit log
            POSAuditService::logTransaction($transaction->id, [
                'invoice_number' => $invoiceNumber,
                'total_amount' => $totalAmount,
                'payment_method' => $data['payment_method'] ?? 'CASH',
                'patient_name' => $data['patient_name'] ?? 'Walk-in Customer',
                'items_count' => count($data['items'] ?? []),
                'created_by_role' => $createdByRole,
            ], $branchId);

            $result['success'] = true;
            $result['transaction'] = $transaction;
            $result['low_stock_warning'] = $lowStockItems;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('CorePOSService createTransaction error: ' . $e->getMessage());
            $result['errors'][] = $e->getMessage();
        }

        return $result;
    }

    /**
     * Decrement stock for a product
     */
    protected function decrementStock(string $productCode, int $branchId, int $quantity): array
    {
        $result = [
            'is_low_stock' => false,
            'stock_info' => null,
        ];

        try {
            // Find the product stock record
            $stockRecord = DB::table('products_stock')
                ->where('item_code', $productCode)
                ->where('branch_id', $branchId)
                ->first();

            if ($stockRecord) {
                $newStock = max(0, $stockRecord->current_stock - $quantity);
                
                DB::table('products_stock')
                    ->where('id', $stockRecord->id)
                    ->update([
                        'current_stock' => $newStock,
                        'updated_at' => now(),
                    ]);

                // Check if low stock
                $reorderLevel = $stockRecord->reorder_level ?? $stockRecord->min_stock ?? 10;
                if ($newStock <= $reorderLevel) {
                    $result['is_low_stock'] = true;
                    $result['stock_info'] = [
                        'code' => $productCode,
                        'name' => $stockRecord->item_name ?? $productCode,
                        'current_stock' => $newStock,
                        'reorder_level' => $reorderLevel,
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::error('CorePOSService decrementStock error: ' . $e->getMessage());
        }

        return $result;
    }

    /**
     * Create low stock notifications
     */
    protected function createLowStockNotifications(array $lowStockItems, int $branchId): void
    {
        try {
            foreach ($lowStockItems as $item) {
                $title = 'Low Stock Alert';
                $message = "Product '{$item['name']}' (Code: {$item['code']}) is running low. Current stock: {$item['current_stock']} units. Reorder level: {$item['reorder_level']} units.";

                // Find users to notify
                $usersToNotify = User::where(function ($query) use ($branchId) {
                        $query->where('branch_id', $branchId)
                              ->whereIn('role', ['branch_admin', 'pharmacist']);
                    })
                    ->orWhere('role', 'super_admin')
                    ->pluck('id');

                foreach ($usersToNotify as $userId) {
                    // Check for duplicate notification in last 24 hours
                    $exists = Notification::where('user_id', $userId)
                        ->where('type', 'low_stock')
                        ->where('message', 'LIKE', "%{$item['code']}%")
                        ->where('created_at', '>=', Carbon::now()->subHours(24))
                        ->exists();

                    if (!$exists) {
                        Notification::create([
                            'user_id' => $userId,
                            'type' => 'low_stock',
                            'title' => $title,
                            'message' => $message,
                            'related_type' => 'product',
                            'related_id' => $item['code'],
                            'status' => 'sent',
                            'channel' => 'in_app',
                            'sent_at' => now(),
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('CorePOSService createLowStockNotifications error: ' . $e->getMessage());
        }
    }

    /**
     * Update daily cash summary
     */
    protected function updateDailySummary(int $branchId, int $cashierId, float $amount, string $paymentMethod): void
    {
        try {
            $today = Carbon::today()->format('Y-m-d');
            
            $summary = DB::table('daily_cash_summaries')
                ->where('branch_id', $branchId)
                ->where('cashier_id', $cashierId)
                ->where('date', $today)
                ->first();

            if ($summary) {
                $updates = [
                    'transaction_count' => DB::raw('transaction_count + 1'),
                    'total_collected' => DB::raw("total_collected + {$amount}"),
                    'updated_at' => now(),
                ];

                if (strtoupper($paymentMethod) === 'CASH') {
                    $updates['cash_total'] = DB::raw("cash_total + {$amount}");
                    $updates['cash_count'] = DB::raw('cash_count + 1');
                    $updates['expected_cash_balance'] = DB::raw("expected_cash_balance + {$amount}");
                } else {
                    $updates['card_total'] = DB::raw("card_total + {$amount}");
                    $updates['card_count'] = DB::raw('card_count + 1');
                }

                DB::table('daily_cash_summaries')
                    ->where('id', $summary->id)
                    ->update($updates);
            } else {
                // Create new summary
                $isCash = strtoupper($paymentMethod) === 'CASH';
                
                DB::table('daily_cash_summaries')->insert([
                    'branch_id' => $branchId,
                    'cashier_id' => $cashierId,
                    'date' => $today,
                    'transaction_count' => 1,
                    'total_collected' => $amount,
                    'cash_total' => $isCash ? $amount : 0,
                    'cash_count' => $isCash ? 1 : 0,
                    'card_total' => $isCash ? 0 : $amount,
                    'card_count' => $isCash ? 0 : 1,
                    'expected_cash_balance' => $isCash ? $amount : 0,
                    'eod_status' => 'OPEN',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('CorePOSService updateDailySummary error: ' . $e->getMessage());
        }
    }

    /**
     * Generate invoice number
     */
    protected function generateInvoiceNumber(int $branchId): string
    {
        $branch = Branch::find($branchId);
        $prefix = $branch ? strtoupper(substr($branch->center_name, 0, 3)) : 'INV';
        $date = Carbon::today()->format('Ymd');
        $count = BillingTransaction::where('branch_id', $branchId)
            ->whereDate('created_at', Carbon::today())
            ->count() + 1;
        return $prefix . '-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate receipt number
     */
    protected function generateReceiptNumber(int $branchId): string
    {
        $branch = Branch::find($branchId);
        $prefix = $branch ? strtoupper(substr($branch->center_name, 0, 2)) : 'RC';
        $count = BillingTransaction::where('branch_id', $branchId)->count() + 1;
        return $prefix . '-' . str_pad($count, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Validate transaction data
     */
    public function validateTransactionData(array $data): array
    {
        $errors = [];

        if (empty($data['items']) || count($data['items']) === 0) {
            $errors[] = 'At least one item is required';
        }

        if (isset($data['paid_amount']) && isset($data['total_amount'])) {
            if ($data['paid_amount'] < $data['total_amount']) {
                $errors[] = 'Paid amount cannot be less than total amount';
            }
        }

        if (!empty($data['payment_method'])) {
            $validMethods = ['CASH', 'CARD', 'MOBILE', 'QRCODE', 'ONLINE'];
            if (!in_array(strtoupper($data['payment_method']), $validMethods)) {
                $errors[] = 'Invalid payment method';
            }
        }

        return $errors;
    }

    /**
     * Check if user can access branch data
     */
    public static function validateBranchAccess(int $branchId, $user = null): bool
    {
        $user = $user ?? Auth::user();
        
        if (!$user) {
            return false;
        }

        // Super admins can access any branch
        if ($user->role_as === 1 || $user->role === 'super_admin') {
            return true;
        }

        // Other users can only access their own branch
        return $user->branch_id === $branchId;
    }

    /**
     * Get the effective branch ID for a request
     * For super admins, returns the requested branch_id
     * For others, returns their assigned branch_id
     */
    public static function getEffectiveBranchId($request, $user = null): ?int
    {
        $user = $user ?? Auth::user();
        
        if (!$user) {
            return null;
        }

        // Super admins can specify a branch
        if ($user->role_as === 1 || $user->role === 'super_admin') {
            return $request->input('branch_id') ?? $user->branch_id;
        }

        // Others use their assigned branch
        return $user->branch_id;
    }
}
