<?php

namespace App\Http\Controllers\Payment;

use Carbon\Carbon;
use App\Services\SmsSender;
use Illuminate\Http\Request;
use App\Models\AllUsers\Patient;
use App\Services\PayHereService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule\DoctorSchedule;
use App\Models\Appointment\AppointmentBooking;

class PayHereWebhookController extends Controller
{
    private PayHereService $payHereService;

    public function __construct(PayHereService $payHereService)
    {
        $this->payHereService = $payHereService;
    }

    public function handleNotification(Request $request): JsonResponse
    {
        try {
            // Log all incoming data for debugging
            Log::info('PayHere webhook received', $request->all());

            $notificationData = $request->all();

            // Required fields per PayHere Checkout API documentation
            $requiredFields = ['merchant_id', 'order_id', 'payment_id', 'md5sig', 'payhere_amount', 'payhere_currency', 'status_code'];
            $missingFields = [];
            foreach ($requiredFields as $field) {
                if (! $request->has($field)) {
                    $missingFields[] = $field;
                }
            }
            
            if (!empty($missingFields)) {
                Log::warning('PayHere webhook missing required fields', [
                    'missing' => $missingFields,
                    'received' => array_keys($notificationData),
                ]);
                return response()->json(['status' => 'error', 'message' => 'Missing required fields: ' . implode(', ', $missingFields)], 400);
            }

            if (! $this->payHereService->verifyNotificationSignature($notificationData)) {
                Log::error('PayHere webhook signature verification failed', [
                    'received' => $notificationData,
                    'merchant_id' => env('PAYHERE_MERCHANT_ID'),
                ]);

                return response()->json(['status' => 'error', 'message' => 'Invalid signature'], 400);
            }

            Log::info('PayHere webhook signature verified successfully');
            $this->processPayment($notificationData);

            return response()->json(['status' => 'success', 'message' => 'Notification processed'], 200);
        } catch (\Exception $e) {
            Log::error('PayHere webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['status' => 'error', 'message' => 'Internal server error'], 500);
        }
    }

    private function processPayment(array $notificationData): void
    {
        $customData = $notificationData['custom_1'] ?? null;
        $orderId = $notificationData['order_id'] ?? null;
        $statusCode = (int) ($notificationData['status_code'] ?? 0);
        $paymentId = $notificationData['payment_id'] ?? null;
        $amount = (float) ($notificationData['payhere_amount'] ?? 0);

        Log::info('Processing PayHere payment', [
            'order_id' => $orderId,
            'custom_data' => $customData,
            'status_code' => $statusCode,
            'payment_id' => $paymentId,
            'amount' => $amount,
        ]);

        try {
            $booking = null;

            // Check if this is a pre-appointment payment (stored in cache)
            if ($customData && str_starts_with($customData, 'TEMP_')) {
                if ($statusCode === 2) {
                    // Payment successful - create booking from cache
                    $booking = $this->payHereService->createAppointmentFromCache($customData, $notificationData);

                    if ($booking) {
                        $booking->update([
                            'payment_id' => $paymentId,
                            'payment_method' => $notificationData['method'] ?? 'payhere',
                        ]);

                        Log::info('Booking created from cache after successful payment', [
                            'booking_id' => $booking->id,
                            'temp_order_id' => $customData,
                            'payhere_payment_id' => $paymentId,
                        ]);

                        $this->sendAppointmentConfirmationSms($booking);
                    } else {
                        Log::error('Failed to create booking from cache', [
                            'temp_order_id' => $customData,
                        ]);
                    }
                } else {
                    // Payment failed - clear cache
                    cache()->forget($customData);
                    Log::info('Payment failed/cancelled, cache cleared', [
                        'temp_order_id' => $customData,
                        'status_code' => $statusCode,
                    ]);
                }
            } else {
                // Existing booking payment
                if ($customData) {
                    $booking = AppointmentBooking::find($customData);
                }

                if ($booking) {
                    $this->payHereService->updateAppointmentPaymentStatus($booking, $notificationData);

                    Log::info('Booking payment status updated', [
                        'booking_id' => $booking->id,
                        'status_code' => $statusCode,
                    ]);

                    if ($statusCode === 2) {
                        $this->sendAppointmentConfirmationSms($booking);
                    }
                } else {
                    Log::error('Booking not found for payment', [
                        'order_id' => $orderId,
                        'custom_data' => $customData,
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Error processing payment', [
                'order_id' => $orderId,
                'custom_data' => $customData,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    private function sendAppointmentConfirmationSms(AppointmentBooking $booking): void
    {
        try {
            $patient = Patient::where('user_id', $booking->patient_id)->first();

            if (! $patient) {
                Log::warning('Patient information not found for SMS notification', [
                    'booking_id' => $booking->id,
                    'patient_id' => $booking->patient_id,
                ]);

                return;
            }

            $doctorSchedule = DoctorSchedule::find($booking->schedule_id);

            if (! $doctorSchedule) {
                Log::warning('Doctor schedule not found for SMS notification', [
                    'booking_id' => $booking->id,
                    'schedule_id' => $booking->schedule_id,
                ]);

                return;
            }

            $slotDurationInMinutes = 12;
            $startTime = Carbon::createFromFormat('H:i:s', $doctorSchedule->start_time);
            $attendantTime = $startTime->copy()->addMinutes($booking->slot_number * $slotDurationInMinutes);

            $message = 'Dear Patient, your payment of Rs. ' . number_format($booking->amount_paid, 2) . ' has been confirmed! '.
                'Your appointment with the doctor is scheduled for '.
                Carbon::parse($booking->appointment_date)->format('Y-m-d').' at '.$attendantTime->format('h:i A').'. '.
                'Slot: '.$booking->slot_number.'. Token: '.$booking->token_number.'.';

            Log::info('Sending SMS confirmation', [
                'booking_id' => $booking->id,
                'phone' => $patient->phone,
            ]);

            SmsSender::sendSMS($patient->phone, $message);

            Log::info('SMS confirmation sent for successful payment', [
                'booking_id' => $booking->id,
                'phone' => $patient->phone,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send SMS confirmation', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
