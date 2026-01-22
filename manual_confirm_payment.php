<?php
/**
 * Manual Payment Confirmation Script
 * 
 * Use this for LOCAL DEVELOPMENT ONLY when PayHere webhooks cannot reach localhost.
 * 
 * Usage: php manual_confirm_payment.php <booking_id>
 * Example: php manual_confirm_payment.php 019b4543-560a-73ca-be49-0cdad81e2e6e
 */

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Appointment\AppointmentBooking;
use Illuminate\Support\Facades\DB;

if ($argc < 2) {
    echo "Usage: php manual_confirm_payment.php <booking_id>\n";
    echo "Example: php manual_confirm_payment.php 019b4543-560a-73ca-be49-0cdad81e2e6e\n";
    exit(1);
}

$bookingId = $argv[1];

echo "=== Manual Payment Confirmation ===\n\n";

// Find the booking
$booking = AppointmentBooking::find($bookingId);

if (!$booking) {
    echo "ERROR: Booking not found with ID: {$bookingId}\n";
    exit(1);
}

echo "Found booking:\n";
echo "  - ID: {$booking->id}\n";
echo "  - Patient ID: {$booking->patient_id}\n";
echo "  - Doctor ID: {$booking->doctor_id}\n";
echo "  - Appointment Date: {$booking->appointment_date}\n";
echo "  - Token Number: {$booking->token_number}\n";
echo "  - Current Status: {$booking->status}\n";
echo "  - Current Payment Status: {$booking->payment_status}\n";
echo "  - Booking Fee: {$booking->booking_fee}\n\n";

if ($booking->payment_status === 'paid') {
    echo "This booking is already marked as PAID.\n";
    exit(0);
}

// Confirm the update
echo "Do you want to mark this payment as CONFIRMED? (yes/no): ";
$handle = fopen("php://stdin", "r");
$line = fgets($handle);

if (trim(strtolower($line)) !== 'yes') {
    echo "Cancelled.\n";
    exit(0);
}

// Update the booking
$booking->update([
    'status' => AppointmentBooking::STATUS_CONFIRMED,
    'payment_status' => 'paid',
    'amount_paid' => $booking->booking_fee ?? 350.00,
    'payment_id' => 'MANUAL_' . time(),
    'payment_date' => now(),
    'payment_method' => 'manual_confirmation',
]);

echo "\n✅ Payment confirmed successfully!\n";
echo "  - New Status: {$booking->fresh()->status}\n";
echo "  - New Payment Status: {$booking->fresh()->payment_status}\n";
echo "  - Amount Paid: {$booking->fresh()->amount_paid}\n";

echo "\nNote: In production, this will be done automatically by PayHere webhook.\n";
