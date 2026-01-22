<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class SmsSender
{
    public static function sendSMS(string $phone, string $message): bool
    {
        try {
            $params = [
                'username' => 'cure_health',
                'password' => 'hq6k2@Qpc42',
                'src'      => 'CURE HEALTH',
                'dst'      => $phone,
                'msg'      => $message,
                'dr'       => '1',
            ];

            // Disable SSL verification for the SMS provider (self-signed certificate)
            $response = Http::withoutVerifying()
                ->timeout(30)
                ->get('https://sms.textware.lk:5001/sms/send_sms.php', $params);

            if ($response->successful()) {
                Log::info('SMS sent successfully to: ' . $phone);
                return true;
            } else {
                Log::error('SMS sending failed: ' . $response->body());
                return false;
            }
        } catch (\Exception $e) {
            Log::error('SMS sending exception: ' . $e->getMessage());
            return false;
        }
    }
}
