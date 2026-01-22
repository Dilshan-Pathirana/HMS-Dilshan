<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$doctorId = 'ef8f9cfc-5ed0-421b-be75-783bd7219cd5';
$date = '2025-12-27';

echo "Deleting cancelled bookings for doctor on $date...\n";

$deleted = DB::table('appointment_bookings')
    ->where('status', 'cancelled')
    ->where('doctor_id', $doctorId)
    ->whereDate('appointment_date', $date)
    ->delete();

echo "Deleted $deleted cancelled booking(s)\n";
