<?php

namespace App\Application\Services;

use App\Core\Exceptions\ResourceNotFoundException;
use App\Domain\ValueObjects\Money;
use Illuminate\Support\Facades\DB;

/**
 * Billing Service
 * Handles invoice generation, payment processing, and financial reporting
 */
class BillingService extends BaseService
{
    /**
     * Generate invoice for session
     */
    public function generateInvoice(int $sessionId): array
    {
        try {
            // Get session details
            $session = DB::table('sessions')->where('id', $sessionId)->first();

            if (!$session) {
                throw new ResourceNotFoundException('Session', $sessionId);
            }

            // Calculate items
            $items = [];
            $subtotal = 0;

            // Add consultation fee
            $consultationFee = $session->consultation_fee ?? 0;
            $items[] = [
                'description' => 'Consultation Fee',
                'quantity' => 1,
                'unit_price' => $consultationFee,
                'total' => $consultationFee,
            ];
            $subtotal += $consultationFee;

            // Add dispensed medications
            $dispensedMeds = DB::table('dispensing_records')
                ->join('medications', 'dispensing_records.medication_id', '=', 'medications.id')
                ->join('prescriptions', 'dispensing_records.prescription_id', '=', 'prescriptions.id')
                ->where('prescriptions.session_id', $sessionId)
                ->select(
                    'medications.medication_name',
                    'dispensing_records.quantity_dispensed',
                    'medications.selling_price'
                )
                ->get();

            foreach ($dispensedMeds as $med) {
                $total = $med->quantity_dispensed * $med->selling_price;
                $items[] = [
                    'description' => $med->medication_name,
                    'quantity' => $med->quantity_dispensed,
                    'unit_price' => $med->selling_price,
                    'total' => $total,
                ];
                $subtotal += $total;
            }

            // Calculate tax (assuming 15% VAT)
            $taxRate = 0.15;
            $taxAmount = $subtotal * $taxRate;
            $totalAmount = $subtotal + $taxAmount;

            // Create invoice
            $invoiceId = DB::table('invoices')->insertGetId([
                'session_id' => $sessionId,
                'patient_id' => $session->patient_id,
                'center_id' => $session->center_id,
                'invoice_date' => now(),
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount' => 0,
                'total_amount' => $totalAmount,
                'payment_status' => 'pending',
                'items' => json_encode($items),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->log('info', 'Invoice generated', [
                'invoice_id' => $invoiceId,
                'session_id' => $sessionId,
                'total_amount' => $totalAmount,
            ]);

            return $this->getInvoice($invoiceId);

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get invoice details
     */
    public function getInvoice(int $invoiceId): array
    {
        $invoice = DB::table('invoices')
            ->where('id', $invoiceId)
            ->first();

        if (!$invoice) {
            throw new ResourceNotFoundException('Invoice', $invoiceId);
        }

        $invoiceArray = (array) $invoice;
        $invoiceArray['items'] = json_decode($invoice->items, true);

        return $invoiceArray;
    }

    /**
     * Process payment
     */
    public function processPayment(int $invoiceId, array $paymentData): array
    {
        try {
            $this->validateRequired($paymentData, ['amount', 'payment_method']);

            $invoice = $this->getInvoice($invoiceId);

            // Validate payment amount
            if ($paymentData['amount'] <= 0) {
                throw new \InvalidArgumentException('Payment amount must be positive');
            }

            // Create payment record
            $paymentId = DB::table('payments')->insertGetId([
                'invoice_id' => $invoiceId,
                'session_id' => $invoice['session_id'],
                'patient_id' => $invoice['patient_id'],
                'center_id' => $invoice['center_id'],
                'amount' => $paymentData['amount'],
                'payment_method' => $paymentData['payment_method'],
                'transaction_id' => $paymentData['transaction_id'] ?? null,
                'payment_date' => now(),
                'status' => 'completed',
                'receipt_number' => $this->generateReceiptNumber(),
                'notes' => $paymentData['notes'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update invoice payment status
            $totalPaid = DB::table('payments')
                ->where('invoice_id', $invoiceId)
                ->where('status', 'completed')
                ->sum('amount');

            $paymentStatus = 'pending';
            if ($totalPaid >= $invoice['total_amount']) {
                $paymentStatus = 'paid';
            } elseif ($totalPaid > 0) {
                $paymentStatus = 'partially_paid';
            }

            DB::table('invoices')
                ->where('id', $invoiceId)
                ->update([
                    'payment_status' => $paymentStatus,
                    'updated_at' => now(),
                ]);

            $this->log('info', 'Payment processed', [
                'payment_id' => $paymentId,
                'invoice_id' => $invoiceId,
                'amount' => $paymentData['amount'],
            ]);

            return [
                'payment_id' => $paymentId,
                'receipt_number' => DB::table('payments')->where('id', $paymentId)->value('receipt_number'),
                'payment_status' => $paymentStatus,
                'amount_paid' => $paymentData['amount'],
                'total_paid' => $totalPaid,
                'balance' => $invoice['total_amount'] - $totalPaid,
            ];

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get financial report for date range
     */
    public function getFinancialReport(string $centerId, string $startDate, string $endDate): array
    {
        $invoices = DB::table('invoices')
            ->where('center_id', $centerId)
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->get();

        $totalRevenue = $invoices->sum('total_amount');
        $paidAmount = $invoices->where('payment_status', 'paid')->sum('total_amount');
        $pendingAmount = $invoices->whereIn('payment_status', ['pending', 'partially_paid'])->sum('total_amount');

        return [
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'total_invoices' => $invoices->count(),
                'total_revenue' => $totalRevenue,
                'paid_amount' => $paidAmount,
                'pending_amount' => $pendingAmount,
                'collection_rate' => $totalRevenue > 0 ? ($paidAmount / $totalRevenue) * 100 : 0,
            ],
        ];
    }

    /**
     * Generate unique receipt number
     */
    private function generateReceiptNumber(): string
    {
        $timestamp = now()->format('YmdHis');
        $random = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        return "RCP-{$timestamp}-{$random}";
    }
}
