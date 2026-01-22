<?php

namespace App\Services;

use App\Models\Appointment\AppointmentBooking;

class PayHereService
{
    private string $merchantId;
    private string $merchantSecret;
    private string $currency;
    private bool $isSandbox;
    private string $baseUrl;

    private const BOOKING_FEE_PER_SLOT = 350.00;

    public function __construct()
    {
        $this->merchantId = env('PAYHERE_MERCHANT_ID', '');
        $this->merchantSecret = env('PAYHERE_MERCHANT_SECRET', '');
        $this->currency = env('PAYHERE_CURRENCY', 'LKR');
        $this->isSandbox = env('PAYHERE_SANDBOX', true);
        $this->baseUrl = $this->isSandbox
            ? 'https://sandbox.payhere.lk'
            : 'https://www.payhere.lk';
    }

    /**
     * Generate PayHere payment data for existing appointment booking.
     * Supports multi-slot bookings with dynamic pricing.
     */
    public function generatePaymentData(AppointmentBooking $booking, array $patientData): array
    {
        // Calculate amount based on booking fee or default per-slot rate
        $amount = $booking->booking_fee ?? self::BOOKING_FEE_PER_SLOT;
        $orderId = $this->generateOrderId($booking->id);

        return $this->buildPaymentData($orderId, $patientData, $booking->id, (float) $amount);
    }

    /**
     * Generate PayHere payment data BEFORE creating appointment.
     * @param int $slotCount Number of slots being booked (for multi-slot pricing)
     */
    public function generatePaymentDataForPreAppointment(string $tempOrderId, array $patientData, array $appointmentData, int $slotCount = 1): array
    {
        // Store appointment data in cache for webhook processing
        cache([$tempOrderId => $appointmentData], now()->addHours(2)); // Cache for 2 hours

        $amount = self::BOOKING_FEE_PER_SLOT * $slotCount;
        return $this->buildPaymentData($tempOrderId, $patientData, $tempOrderId, $amount, $slotCount);
    }

    /**
     * Build PayHere payment data array.
     * @param float $amount Total payment amount
     * @param int $slotCount Number of slots for item description
     */
    private function buildPaymentData(string $orderId, array $patientData, string $customData, float $amount = 350.00, int $slotCount = 1): array
    {
        $frontendUrl = env('FRONTEND_URL', env('APP_URL'));
        $returnUrl = $frontendUrl.'/appointment-confirmation/'.$orderId;
        $cancelUrl = $frontendUrl.'/appointment-cancelled/'.$orderId;
        $notifyUrl = env('APP_URL').'/api/payments/payhere/webhook';

        $amountFormatted = number_format($amount, 2, '.', '');

        $hashedSecret = strtoupper(md5($this->merchantSecret));
        $hash = strtoupper(md5(
            $this->merchantId.$orderId.$amountFormatted.$this->currency.$hashedSecret
        ));

        // Dynamic item description based on slot count
        $items = $slotCount > 1 
            ? "Appointment Booking ({$slotCount} slots)" 
            : 'Appointment Booking';

        return [
            'merchant_id' => $this->merchantId,
            'return_url' => $returnUrl,
            'cancel_url' => $cancelUrl,
            'notify_url' => $notifyUrl,
            'order_id' => $orderId,
            'items' => $items,
            'currency' => $this->currency,
            'amount' => $amountFormatted,
            'first_name' => $patientData['first_name'],
            'last_name' => $patientData['last_name'],
            'email' => $patientData['email'],
            'phone' => $patientData['phone'],
            'address' => $patientData['address'] ?? '',
            'city' => 'Anuradhapura',
            'country' => 'Sri Lanka',
            'hash' => $hash,
            'custom_1' => $customData, // Pass appointment ID or temp order ID for webhook processing
            'payment_url' => $this->baseUrl.'/pay/checkout',
        ];
    }

    /**
     * Generate unique order ID.
     */
    private function generateOrderId(string $appointmentId): string
    {
        return 'APPT_'.$appointmentId.'_'.time();
    }

    /**
     * Verify PayHere notification signature.
     * 
     * According to PayHere Checkout API documentation:
     * md5sig = strtoupper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + strtoupper(md5(merchant_secret))))
     */
    public function verifyNotificationSignature(array $notificationData): bool
    {
        $merchantId = $notificationData['merchant_id'] ?? '';
        $orderId = $notificationData['order_id'] ?? '';
        // PayHere sends payhere_amount already formatted (e.g., "350.00")
        // We should use it exactly as received, not reformat it
        $amount = $notificationData['payhere_amount'] ?? '';
        $currency = $notificationData['payhere_currency'] ?? '';
        $statusCode = $notificationData['status_code'] ?? '';
        $providedHash = strtoupper($notificationData['md5sig'] ?? '');

        $hashedSecret = strtoupper(md5($this->merchantSecret));
        $expectedHash = strtoupper(md5(
            $merchantId.$orderId.$amount.$currency.$statusCode.$hashedSecret
        ));

        // Log for debugging (remove in production)
        \Illuminate\Support\Facades\Log::debug('PayHere signature verification', [
            'merchant_id' => $merchantId,
            'order_id' => $orderId,
            'amount' => $amount,
            'currency' => $currency,
            'status_code' => $statusCode,
            'expected_hash' => $expectedHash,
            'provided_hash' => $providedHash,
            'match' => $expectedHash === $providedHash,
        ]);

        return $expectedHash === $providedHash;
    }

    /**
     * Create PayHere payment form HTML (without auto-submit).
     */
    public function createPaymentForm(array $paymentData): string
    {
        $formFields = '';
        foreach ($paymentData as $key => $value) {
            if ($key !== 'payment_url') {
                $formFields .= '<input type="hidden" name="'.htmlspecialchars($key).'" value="'.htmlspecialchars($value).'">'."\n";
            }
        }

        return '<form id="payhere-payment-form" action="'.$paymentData['payment_url'].'" method="post">'."\n".$formFields.'</form>';
    }

    /**
     * Create appointment booking from cached data after successful payment.
     */
    public function createAppointmentFromCache(string $tempOrderId, array $notificationData): ?AppointmentBooking
    {
        $appointmentData = cache($tempOrderId);

        if (! $appointmentData) {
            return null;
        }

        // Create the appointment booking
        $booking = AppointmentBooking::create([
            'schedule_id' => $appointmentData['schedule_id'],
            'patient_id' => $appointmentData['patient_id'] ?? $appointmentData['user_id'],
            'doctor_id' => $appointmentData['doctor_id'],
            'branch_id' => $appointmentData['branch_id'],
            'appointment_date' => $appointmentData['date'] ?? $appointmentData['appointment_date'],
            'appointment_time' => $appointmentData['appointment_time'] ?? null,
            'slot_number' => $appointmentData['slot'] ?? $appointmentData['slot_number'],
            'status' => AppointmentBooking::STATUS_CONFIRMED,
            'payment_status' => 'paid',
            'payment_id' => $notificationData['payment_id'],
            'booking_fee' => $appointmentData['booking_fee'] ?? 350.00,
            'amount_paid' => (float) $notificationData['payhere_amount'],
            'payment_date' => now(),
        ]);

        // Remove from cache after creating appointment
        cache()->forget($tempOrderId);

        return $booking;
    }

    /**
     * Update appointment booking payment status.
     */
    public function updateAppointmentPaymentStatus(AppointmentBooking $booking, array $notificationData): void
    {
        $statusCode = (int) $notificationData['status_code'];
        $paymentId = $notificationData['payment_id'];
        $amount = (float) $notificationData['payhere_amount'];

        $updateData = [
            'payment_id' => $paymentId,
        ];

        switch ($statusCode) {
            case 2: // Success
                $updateData['status'] = AppointmentBooking::STATUS_CONFIRMED;
                $updateData['payment_status'] = 'paid';
                $updateData['amount_paid'] = $amount;
                $updateData['payment_date'] = now();
                break;
            case 0: // Pending
                $updateData['payment_status'] = 'pending';
                break;
            case -1: // Canceled
                $updateData['payment_status'] = 'canceled';
                break;
            case -2: // Failed
                $updateData['payment_status'] = 'failed';
                break;
            case -3: // Chargedback
                $updateData['status'] = AppointmentBooking::STATUS_CANCELLED;
                $updateData['payment_status'] = 'chargedback';
                break;
            default:
                $updateData['payment_status'] = 'unknown';
                break;
        }

        $booking->update($updateData);
    }
}
