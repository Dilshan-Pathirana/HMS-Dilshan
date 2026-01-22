<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Appointment\AppointmentBooking;

echo "=== Manual Cleanup of Pending Bookings ===\n\n";

$patientId = '019b3a94-ab7e-709d-85fc-6f45aeaf235e';

$pendingBookings = AppointmentBooking::where('patient_id', $patientId)
    ->where('status', 'pending_payment')
    ->where('payment_status', 'pending')
    ->get();

echo "Found {$pendingBookings->count()} pending bookings for patient\n\n";

foreach ($pendingBookings as $booking) {
    echo "Cancelling: {$booking->id} - Slot {$booking->slot_number} on {$booking->appointment_date}\n";
    $booking->update([
        'status' => 'cancelled',
        'payment_status' => 'expired'
    ]);
}

echo "\n✅ All pending bookings cancelled!\n";
