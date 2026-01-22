<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Appointment\AppointmentBooking;

echo "=== Stale Booking Cleanup ===" . PHP_EOL;
echo "Before cleanup - Pending payment: " . AppointmentBooking::where('status', 'pending_payment')->count() . PHP_EOL;

$cleaned = AppointmentBooking::cleanupStalePendingBookings(30);

echo "Cleaned up: " . $cleaned . " stale bookings" . PHP_EOL;
echo "After cleanup - Pending payment: " . AppointmentBooking::where('status', 'pending_payment')->count() . PHP_EOL;

// Also show current bookings summary
echo PHP_EOL . "=== Booking Summary ===" . PHP_EOL;
echo "Total bookings: " . AppointmentBooking::count() . PHP_EOL;
echo "Confirmed: " . AppointmentBooking::where('status', 'confirmed')->count() . PHP_EOL;
echo "Pending payment: " . AppointmentBooking::where('status', 'pending_payment')->count() . PHP_EOL;
echo "Cancelled: " . AppointmentBooking::where('status', 'cancelled')->count() . PHP_EOL;
