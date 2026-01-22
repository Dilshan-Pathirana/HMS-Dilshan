<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Repositories\InvoiceRepositoryInterface;
use App\Domain\Repositories\PaymentRepositoryInterface;
use App\Domain\Repositories\SessionRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class BillingController extends Controller
{
    public function __construct(
        private InvoiceRepositoryInterface $invoiceRepository,
        private PaymentRepositoryInterface $paymentRepository,
        private SessionRepositoryInterface $sessionRepository
    ) {}

    public function invoices(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;

        if ($request->has('status')) {
            $invoices = $this->invoiceRepository->getByPaymentStatus($request->status, $centerId);
        } elseif ($request->has('patient_id')) {
            $invoices = $this->invoiceRepository->getByPatient($request->patient_id);
        } else {
            $invoices = $this->invoiceRepository->getPendingByCenter($centerId, $request->per_page ?? 15);
        }

        return response()->json($invoices);
    }

    public function createInvoice(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'session_id' => 'nullable|exists:sessions,id',
            'patient_id' => 'required|exists:patients,id',
            'items' => 'required|array',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Calculate totals
        $subtotal = 0;
        foreach ($request->items as $item) {
            $subtotal += $item['quantity'] * $item['unit_price'];
        }

        $discount = $request->discount ?? 0;
        $taxAmount = ($subtotal - $discount) * 0.15; // 15% VAT
        $totalAmount = $subtotal - $discount + $taxAmount;

        $invoiceData = [
            'session_id' => $request->session_id,
            'patient_id' => $request->patient_id,
            'center_id' => $request->user()->center_id,
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'discount' => $discount,
            'total_amount' => $totalAmount,
            'payment_status' => 'pending',
            'items' => $request->items,
            'generated_by' => $request->user()->id,
        ];

        $invoice = $this->invoiceRepository->create($invoiceData);

        return response()->json($invoice, 201);
    }

    public function showInvoice(int $id): JsonResponse
    {
        $invoice = $this->invoiceRepository->findWithPayments($id);

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        return response()->json($invoice);
    }

    public function recordPayment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,card,bank_transfer,insurance,other',
            'payment_date' => 'required|date',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $invoice = $this->invoiceRepository->find($request->invoice_id);

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $data = $validator->validated();
        $data['patient_id'] = $invoice->patient_id;
        $data['center_id'] = $invoice->center_id;
        $data['status'] = 'completed';
        $data['processed_by'] = $request->user()->id;

        $payment = $this->paymentRepository->create($data);

        // Update invoice payment status
        $totalPaid = $this->paymentRepository->getByInvoice($invoice->id)->sum('amount');
        
        if ($totalPaid >= $invoice->total_amount) {
            $this->invoiceRepository->update($invoice->id, ['payment_status' => 'paid']);
        } elseif ($totalPaid > 0) {
            $this->invoiceRepository->update($invoice->id, ['payment_status' => 'partially_paid']);
        }

        return response()->json($payment, 201);
    }

    public function payments(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;

        if ($request->has('date')) {
            $payments = $this->paymentRepository->getDailyCollection(
                $centerId,
                Carbon::parse($request->date)
            );
        } elseif ($request->has('patient_id')) {
            $payments = $this->paymentRepository->getByPatient($request->patient_id);
        } else {
            $startDate = $request->has('start_date') 
                ? Carbon::parse($request->start_date) 
                : now()->startOfMonth();
            $endDate = $request->has('end_date')
                ? Carbon::parse($request->end_date)
                : now()->endOfMonth();

            $payments = $this->paymentRepository->getByDateRange($centerId, $startDate, $endDate);
        }

        return response()->json($payments);
    }

    public function revenueReport(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;
        $startDate = Carbon::parse($request->start_date ?? now()->startOfMonth());
        $endDate = Carbon::parse($request->end_date ?? now()->endOfMonth());

        $revenue = $this->invoiceRepository->getTotalRevenue($centerId, $startDate, $endDate);
        $payments = $this->paymentRepository->getTotalByDateRange($centerId, $startDate, $endDate);

        return response()->json([
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString()
            ],
            'total_revenue' => $revenue,
            'total_payments' => $payments,
            'invoices' => $this->invoiceRepository->getByDateRange($centerId, $startDate, $endDate)->count()
        ]);
    }
}
