<?php

namespace App\Services;

use App\Models\SmsLog;
use App\Models\Appointment\AppointmentBooking;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class AppointmentSmsService
{
    private string $gateway = 'textware';
    private string $gatewayUrl = 'https://sms.textware.lk:5001/sms/send_sms.php';
    private string $username = 'cure_health';
    private string $password = 'hq6k2@Qpc42';
    private string $senderId = 'CURE HEALTH';

    /**
     * Send appointment cancellation SMS to patient
     * 
     * @param AppointmentBooking $booking The cancelled appointment
     * @param string $patientPhone Patient's phone number
     * @param array $appointmentDetails Additional details (doctor_name, date, branch_name)
     * @return bool
     */
    public function sendCancellationSms(
        AppointmentBooking $booking,
        string $patientPhone,
        array $appointmentDetails
    ): bool {
        // Validate inputs
        if (empty($patientPhone)) {
            Log::warning('SMS cancellation skipped: No phone number provided', [
                'booking_id' => $booking->id,
            ]);
            return false;
        }

        // Build the SMS message
        $message = $this->buildCancellationMessage($appointmentDetails);

        // Create SMS log entry
        $smsLog = SmsLog::createLog(
            SmsLog::TYPE_APPOINTMENT_CANCELLATION,
            SmsLog::RECIPIENT_PATIENT,
            $booking->patient_id,
            $patientPhone,
            $message,
            $booking->id,
            'appointment_booking',
            $this->gateway
        );

        // Send SMS asynchronously (non-blocking)
        try {
            $success = $this->sendSms($patientPhone, $message);

            if ($success) {
                $smsLog->markAsSent();
                Log::info('Appointment cancellation SMS sent successfully', [
                    'booking_id' => $booking->id,
                    'patient_id' => $booking->patient_id,
                    'phone_masked' => $smsLog->phone_masked,
                    'sms_log_id' => $smsLog->id,
                ]);
                return true;
            } else {
                $smsLog->markAsFailed('SMS gateway returned failure');
                Log::error('Appointment cancellation SMS failed', [
                    'booking_id' => $booking->id,
                    'patient_id' => $booking->patient_id,
                    'phone_masked' => $smsLog->phone_masked,
                    'sms_log_id' => $smsLog->id,
                ]);
                return false;
            }
        } catch (\Exception $e) {
            $smsLog->markAsFailed($e->getMessage());
            Log::error('Appointment cancellation SMS exception', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
                'sms_log_id' => $smsLog->id,
            ]);
            // Do NOT throw - SMS failure should not affect cancellation
            return false;
        }
    }

    /**
     * Build cancellation SMS message
     */
    private function buildCancellationMessage(array $details): string
    {
        $doctorName = $details['doctor_name'] ?? 'Your Doctor';
        $date = $details['date'] ?? 'N/A';
        $branchName = $details['branch_name'] ?? 'CURE Health';

        // Format date nicely if it's a valid date
        if ($date !== 'N/A') {
            try {
                $dateObj = new \DateTime($date);
                $date = $dateObj->format('M d, Y');
            } catch (\Exception $e) {
                // Keep original format
            }
        }

        return "Your appointment has been successfully cancelled.\n\n" .
               "Doctor: {$doctorName}\n" .
               "Date: {$date}\n" .
               "Branch: {$branchName}\n\n" .
               "Thank you.\n- CURE Health";
    }

    /**
     * Send appointment reschedule SMS to patient
     * 
     * @param AppointmentBooking $newBooking The new rescheduled appointment
     * @param string $patientPhone Patient's phone number
     * @param array $appointmentDetails Additional details (doctor_name, old_date, new_date, new_time, new_token, branch_name)
     * @return bool
     */
    public function sendRescheduleSms(
        AppointmentBooking $newBooking,
        string $patientPhone,
        array $appointmentDetails
    ): bool {
        // Validate inputs
        if (empty($patientPhone)) {
            Log::warning('SMS reschedule skipped: No phone number provided', [
                'booking_id' => $newBooking->id,
            ]);
            return false;
        }

        // Build the SMS message
        $message = $this->buildRescheduleMessage($appointmentDetails);

        // Create SMS log entry
        $smsLog = SmsLog::createLog(
            SmsLog::TYPE_APPOINTMENT_RESCHEDULE,
            SmsLog::RECIPIENT_PATIENT,
            $newBooking->patient_id,
            $patientPhone,
            $message,
            $newBooking->id,
            'appointment_booking',
            $this->gateway
        );

        // Send SMS
        try {
            $success = $this->sendSms($patientPhone, $message);

            if ($success) {
                $smsLog->markAsSent();
                Log::info('Appointment reschedule SMS sent successfully', [
                    'booking_id' => $newBooking->id,
                    'patient_id' => $newBooking->patient_id,
                    'phone_masked' => $smsLog->phone_masked,
                    'sms_log_id' => $smsLog->id,
                ]);
                return true;
            } else {
                $smsLog->markAsFailed('SMS gateway returned failure');
                Log::error('Appointment reschedule SMS failed', [
                    'booking_id' => $newBooking->id,
                    'patient_id' => $newBooking->patient_id,
                    'phone_masked' => $smsLog->phone_masked,
                    'sms_log_id' => $smsLog->id,
                ]);
                return false;
            }
        } catch (\Exception $e) {
            $smsLog->markAsFailed($e->getMessage());
            Log::error('Appointment reschedule SMS exception', [
                'booking_id' => $newBooking->id,
                'error' => $e->getMessage(),
                'sms_log_id' => $smsLog->id,
            ]);
            // Do NOT throw - SMS failure should not affect reschedule
            return false;
        }
    }

    /**
     * Build reschedule SMS message
     */
    private function buildRescheduleMessage(array $details): string
    {
        $doctorName = $details['doctor_name'] ?? 'Your Doctor';
        $oldDate = $details['old_date'] ?? 'N/A';
        $newDate = $details['new_date'] ?? 'N/A';
        $newTime = $details['new_time'] ?? 'N/A';
        $newToken = $details['new_token'] ?? 'N/A';
        $branchName = $details['branch_name'] ?? 'CURE Health';

        // Format dates nicely
        $formatDate = function($date) {
            if ($date === 'N/A') return $date;
            try {
                $dateObj = new \DateTime($date);
                return $dateObj->format('M d, Y');
            } catch (\Exception $e) {
                return $date;
            }
        };

        $oldDateFormatted = $formatDate($oldDate);
        $newDateFormatted = $formatDate($newDate);

        return "Your appointment has been rescheduled.\n\n" .
               "Doctor: {$doctorName}\n" .
               "New Date: {$newDateFormatted}\n" .
               "New Time: {$newTime}\n" .
               "Token #: {$newToken}\n" .
               "Branch: {$branchName}\n\n" .
               "Thank you.\n- CURE Health";
    }

    /**
     * Send SMS via gateway
     */
    private function sendSms(string $phone, string $message): bool
    {
        try {
            $params = [
                'username' => $this->username,
                'password' => $this->password,
                'src' => $this->senderId,
                'dst' => $phone,
                'msg' => $message,
                'dr' => '1',
            ];

            // Disable SSL verification for the SMS provider (self-signed certificate)
            $response = Http::withoutVerifying()
                ->timeout(30)
                ->get($this->gatewayUrl, $params);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('SMS gateway exception: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get patient phone number from booking
     */
    public static function getPatientPhoneFromBooking(AppointmentBooking $booking): ?string
    {
        // Try to get phone from patients table
        $patient = DB::table('patients')
            ->where('user_id', $booking->patient_id)
            ->select('phone_number', 'phone')
            ->first();

        if ($patient) {
            return $patient->phone_number ?? $patient->phone ?? null;
        }

        // Fallback: Try users table
        $user = DB::table('users')
            ->where('id', $booking->patient_id)
            ->select('phone')
            ->first();

        return $user->phone ?? null;
    }

    /**
     * Get appointment details for SMS
     */
    public static function getAppointmentDetailsForSms(AppointmentBooking $booking): array
    {
        // Get doctor name
        $doctor = DB::table('users')
            ->where('id', $booking->doctor_id)
            ->select('first_name', 'last_name')
            ->first();

        $doctorName = $doctor 
            ? 'Dr. ' . trim($doctor->first_name . ' ' . $doctor->last_name)
            : 'Your Doctor';

        // Get branch name
        $branch = DB::table('branches')
            ->where('id', $booking->branch_id)
            ->select('name', 'center_name')
            ->first();

        $branchName = $branch->center_name ?? $branch->name ?? 'CURE Health';

        return [
            'doctor_name' => $doctorName,
            'date' => $booking->appointment_date->format('Y-m-d'),
            'branch_name' => $branchName,
            'token_number' => $booking->token_number,
            'slot_number' => $booking->slot_number,
        ];
    }

    /**
     * Send patient credentials SMS after registration
     * 
     * @param string $phoneNumber Patient's mobile number
     * @param string $username Generated username
     * @param string $password Generated password
     * @param string $hospitalName Hospital/branch name
     * @param string $patientName Patient's full name
     * @return bool
     */
    public function sendPatientCredentialsSms(
        string $phoneNumber,
        string $username,
        string $password,
        string $hospitalName,
        string $patientName
    ): bool {
        if (empty($phoneNumber)) {
            Log::warning('Patient credentials SMS skipped: No phone number provided');
            return false;
        }

        // Build the SMS message
        $message = $this->buildCredentialsMessage($username, $password, $hospitalName, $patientName);

        // Create SMS log entry
        $smsLog = SmsLog::createLog(
            'patient_credentials',
            SmsLog::RECIPIENT_PATIENT,
            null, // patient_id not available yet in log context
            $phoneNumber,
            $message,
            null,
            'patient_registration',
            $this->gateway
        );

        try {
            $success = $this->sendSms($phoneNumber, $message);

            if ($success) {
                $smsLog->markAsSent();
                Log::info('Patient credentials SMS sent successfully', [
                    'phone_masked' => $smsLog->phone_masked,
                    'username' => $username,
                ]);
                return true;
            } else {
                $smsLog->markAsFailed('SMS gateway returned failure');
                Log::error('Patient credentials SMS failed', [
                    'phone_masked' => $smsLog->phone_masked,
                ]);
                return false;
            }
        } catch (\Exception $e) {
            $smsLog->markAsFailed($e->getMessage());
            Log::error('Patient credentials SMS exception', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Build credentials SMS message
     */
    private function buildCredentialsMessage(
        string $username,
        string $password,
        string $hospitalName,
        string $patientName
    ): string {
        $loginUrl = config('app.url', 'https://portal.curehealth.lk') . '/login';
        
        return "Welcome to {$hospitalName}!\n\n" .
               "Dear {$patientName},\n" .
               "Your patient account has been created.\n\n" .
               "Username: {$username}\n" .
               "Password: {$password}\n\n" .
               "Login: {$loginUrl}\n\n" .
               "Thank you.\n- CURE Health";
    }

    /**
     * Send appointment confirmation SMS to patient
     * 
     * @param AppointmentBooking $booking The appointment booking
     * @param string $patientPhone Patient's phone number
     * @param array $appointmentDetails Additional details
     * @return bool
     */
    public function sendAppointmentConfirmationSms(
        AppointmentBooking $booking,
        string $patientPhone,
        array $appointmentDetails
    ): bool {
        if (empty($patientPhone)) {
            Log::warning('Appointment confirmation SMS skipped: No phone number provided', [
                'booking_id' => $booking->id,
            ]);
            return false;
        }

        // Build the SMS message
        $message = $this->buildConfirmationMessage($appointmentDetails);

        // Create SMS log entry
        $smsLog = SmsLog::createLog(
            'appointment_confirmation',
            SmsLog::RECIPIENT_PATIENT,
            $booking->patient_id,
            $patientPhone,
            $message,
            $booking->id,
            'appointment_booking',
            $this->gateway
        );

        try {
            $success = $this->sendSms($patientPhone, $message);

            if ($success) {
                $smsLog->markAsSent();
                Log::info('Appointment confirmation SMS sent successfully', [
                    'booking_id' => $booking->id,
                    'patient_id' => $booking->patient_id,
                    'token_number' => $booking->token_number,
                ]);
                return true;
            } else {
                $smsLog->markAsFailed('SMS gateway returned failure');
                Log::error('Appointment confirmation SMS failed', [
                    'booking_id' => $booking->id,
                ]);
                return false;
            }
        } catch (\Exception $e) {
            $smsLog->markAsFailed($e->getMessage());
            Log::error('Appointment confirmation SMS exception', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Build appointment confirmation SMS message
     */
    private function buildConfirmationMessage(array $details): string
    {
        $doctorName = $details['doctor_name'] ?? 'Your Doctor';
        $date = $details['date'] ?? 'N/A';
        $branchName = $details['branch_name'] ?? 'CURE Health';
        $tokenNumber = $details['token_number'] ?? 'N/A';
        $time = $details['time'] ?? null;

        // Format date nicely
        if ($date !== 'N/A') {
            try {
                $dateObj = new \DateTime($date);
                $date = $dateObj->format('M d, Y');
            } catch (\Exception $e) {
                // Keep original format
            }
        }

        $message = "Your appointment is confirmed!\n\n" .
                   "Doctor: {$doctorName}\n" .
                   "Date: {$date}\n";
        
        if ($time) {
            $message .= "Time: {$time}\n";
        }
        
        $message .= "Token #: {$tokenNumber}\n" .
                    "Branch: {$branchName}\n\n" .
                    "Please arrive 15 min early.\n" .
                    "Thank you.\n- CURE Health";

        return $message;
    }

    /**
     * Send appointment status update SMS to patient
     * Used for significant status changes like check-in reminders, no-show notices, etc.
     * 
     * @param AppointmentBooking $booking The appointment
     * @param string $patientPhone Patient's phone number
     * @param string $newStatus The new status
     * @param array $appointmentDetails Additional details
     * @return bool
     */
    public function sendStatusUpdateSms(
        AppointmentBooking $booking,
        string $patientPhone,
        string $newStatus,
        array $appointmentDetails
    ): bool {
        if (empty($patientPhone)) {
            Log::warning('SMS status update skipped: No phone number provided', [
                'booking_id' => $booking->id,
            ]);
            return false;
        }

        // Only send SMS for significant status changes
        $notifiableStatuses = ['no_show', 'checked_in', 'completed'];
        if (!in_array($newStatus, $notifiableStatuses)) {
            return false;
        }

        $message = $this->buildStatusUpdateMessage($newStatus, $appointmentDetails);

        $smsLog = SmsLog::createLog(
            'appointment_status_update',
            SmsLog::RECIPIENT_PATIENT,
            $booking->patient_id,
            $patientPhone,
            $message,
            $booking->id,
            'appointment_booking',
            $this->gateway
        );

        try {
            $success = $this->sendSms($patientPhone, $message);

            if ($success) {
                $smsLog->markAsSent();
                Log::info('Appointment status update SMS sent successfully', [
                    'booking_id' => $booking->id,
                    'new_status' => $newStatus,
                    'phone_masked' => $smsLog->phone_masked,
                ]);
                return true;
            } else {
                $smsLog->markAsFailed('SMS gateway returned failure');
                return false;
            }
        } catch (\Exception $e) {
            $smsLog->markAsFailed($e->getMessage());
            Log::error('Appointment status update SMS exception', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Build status update SMS message based on status
     */
    private function buildStatusUpdateMessage(string $status, array $details): string
    {
        $doctorName = $details['doctor_name'] ?? 'Your Doctor';
        $date = $details['date'] ?? 'N/A';
        $branchName = $details['branch_name'] ?? 'CURE Health';
        $tokenNumber = $details['token_number'] ?? 'N/A';

        // Format date
        if ($date !== 'N/A') {
            try {
                $dateObj = new \DateTime($date);
                $date = $dateObj->format('M d, Y');
            } catch (\Exception $e) {
                // Keep original
            }
        }

        switch ($status) {
            case 'no_show':
                return "You missed your appointment.\n\n" .
                       "Doctor: {$doctorName}\n" .
                       "Date: {$date}\n" .
                       "Token #: {$tokenNumber}\n\n" .
                       "Please contact us to reschedule.\n" .
                       "- CURE Health\n{$branchName}";

            case 'checked_in':
                return "Check-in confirmed!\n\n" .
                       "Doctor: {$doctorName}\n" .
                       "Token #: {$tokenNumber}\n\n" .
                       "Please wait for your turn.\n" .
                       "- CURE Health";

            case 'completed':
                return "Your appointment is complete.\n\n" .
                       "Doctor: {$doctorName}\n" .
                       "Thank you for visiting CURE Health.\n" .
                       "We hope you have a speedy recovery!\n\n" .
                       "- {$branchName}";

            default:
                return "Your appointment status has been updated.\n\n" .
                       "Doctor: {$doctorName}\n" .
                       "Date: {$date}\n" .
                       "Token #: {$tokenNumber}\n\n" .
                       "- CURE Health";
        }
    }
}
