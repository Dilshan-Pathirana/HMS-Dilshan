<?php

namespace App\Http\Controllers\PatientAppointment;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Models\Appointment\AppointmentBooking;

class AppointmentStatusController extends Controller
{
    /**
     * Create a JSON response with CORS headers.
     */
    private function corsResponse(array $data, int $status = 200): JsonResponse
    {
        return response()->json($data, $status)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    /**
     * Check appointment status by order ID.
     */
    public function checkByOrderId(Request $request): JsonResponse
    {
        $orderId = $request->input('order_id');

        if (! $orderId) {
            return $this->corsResponse([
                'success' => false,
                'message' => 'Order ID is required',
            ], 400);
        }

        try {
            // For temporary orders, check if appointment was created by webhook
            if (str_starts_with($orderId, 'TEMP_')) {
                // Look for booking where payment_id matches
                $booking = AppointmentBooking::where('payment_id', 'LIKE', '%'.$orderId.'%')
                    ->orWhere('payment_id', 'LIKE', $orderId.'_%')
                    ->where('payment_status', 'paid')
                    ->first();

                if ($booking) {
                    return $this->corsResponse([
                        'success' => true,
                        'status' => 'success',
                        'message' => 'Payment successful and appointment confirmed',
                        'data' => [
                            'appointment_id' => $booking->id,
                            'payment_status' => $booking->payment_status,
                            'status' => $booking->status,
                            'payment_amount' => $booking->amount_paid,
                            'payment_date' => $booking->payment_date,
                            'order_id' => $orderId,
                            'token_number' => $booking->token_number,
                            'slot_number' => $booking->slot_number,
                            'appointment_date' => $booking->appointment_date,
                        ],
                    ]);
                }

                // If no paid booking found, payment is still processing
                return $this->corsResponse([
                    'success' => true,
                    'status' => 'pending',
                    'message' => 'Payment is still being processed',
                ]);
            }

            // For regular order IDs (APPT_xxx format), extract booking ID and check
            $bookingId = null;
            if (str_starts_with($orderId, 'APPT_')) {
                // Extract booking ID from order_id format: APPT_{booking_id}_{timestamp}
                // The booking_id is a UUID with hyphens, so we need to extract it properly
                // Format: APPT_[uuid]_[timestamp]
                // Example: APPT_019b4537-45ef-72c8-bf37-b68c1f13c495_1766392809
                $withoutPrefix = substr($orderId, 5); // Remove "APPT_"
                $lastUnderscore = strrpos($withoutPrefix, '_'); // Find last underscore (before timestamp)
                if ($lastUnderscore !== false) {
                    $bookingId = substr($withoutPrefix, 0, $lastUnderscore);
                } else {
                    $bookingId = $withoutPrefix;
                }
            }

            \Illuminate\Support\Facades\Log::info('Checking appointment status', [
                'order_id' => $orderId,
                'extracted_booking_id' => $bookingId,
            ]);

            $booking = $bookingId 
                ? AppointmentBooking::find($bookingId)
                : AppointmentBooking::where('payment_id', $orderId)->first();

            if ($booking) {
                // Determine status based on payment_status
                // pending = still waiting for payment webhook
                // paid = payment confirmed
                // failed/canceled = payment failed
                $status = match($booking->payment_status) {
                    'paid' => 'success',
                    'pending' => 'pending',
                    default => 'failed',
                };

                $message = match($status) {
                    'success' => 'Payment successful and appointment confirmed',
                    'pending' => 'Payment is being processed. Please wait...',
                    default => 'Payment was not completed',
                };

                return $this->corsResponse([
                    'success' => true,
                    'status' => $status,
                    'message' => $message,
                    'data' => [
                        'appointment_id' => $booking->id,
                        'payment_status' => $booking->payment_status,
                        'status' => $booking->status,
                        'payment_amount' => $booking->amount_paid ?? $booking->booking_fee,
                        'payment_date' => $booking->payment_date,
                        'order_id' => $orderId,
                        'token_number' => $booking->token_number,
                        'slot_number' => $booking->slot_number,
                        'appointment_date' => $booking->appointment_date,
                    ],
                ]);
            }

            return $this->corsResponse([
                'success' => true,
                'status' => 'pending',
                'message' => 'Payment is being processed',
            ]);
        } catch (\Exception $e) {
            return $this->corsResponse([
                'success' => false,
                'message' => 'Error checking appointment status',
            ], 500);
        }
    }
}
