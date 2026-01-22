<?php

namespace App\Helpers;

use Carbon\Carbon;

class SmsTemplates
{
    /**
     * Generate SMS message for admin-created appointment.
     */
    public static function adminAppointmentConfirmation(
        string $patientFirstName,
        string $patientLastName,
        string $doctorFirstName,
        string $doctorLastName,
        string $appointmentDate,
        string $appointmentTime,
        string $branchName,
        int $slotNumber
    ): string {
        return "Dear {$patientFirstName} {$patientLastName}, your appointment has been scheduled by our admin team. ".
               "Date: {$appointmentDate} at {$appointmentTime} ".
               "Slot: {$slotNumber} ".
               "Doctor: Dr. {$doctorFirstName} {$doctorLastName} ".
               "Location: {$branchName} ".
               'Thank you for choosing CURE HEALTH.';
    }

    /**
     * Generate SMS message for payment confirmation.
     */
    public static function paymentConfirmation(
        string $appointmentDate,
        string $appointmentTime
    ): string {
        return 'Dear Patient, your payment has been confirmed! Your appointment with the doctor is scheduled for '.
               "{$appointmentDate} at {$appointmentTime}.";
    }

    /**
     * Generate SMS message for appointment change.
     */
    public static function appointmentChange(
        string $patientFirstName,
        string $patientLastName,
        string $doctorFirstName,
        string $doctorLastName,
        string $newDate,
        string $newTime,
        string $branchName
    ): string {
        return "Dear {$patientFirstName} {$patientLastName}, your appointment with Dr. {$doctorFirstName} {$doctorLastName} ".
               "has been rescheduled to {$newDate} at {$newTime} at {$branchName}.";
    }

    /**
     * Calculate appointment time from slot and start time.
     */
    public static function calculateAppointmentTime(string $startTime, int $slot): string
    {
        $slotDurationInMinutes = 12;
        $startTimeCarbon = Carbon::createFromFormat('H:i:s', $startTime);
        $appointmentTime = $startTimeCarbon->copy()->addMinutes($slot * $slotDurationInMinutes);

        return $appointmentTime->format('h:i A');
    }

    /**
     * Format date for SMS display.
     */
    public static function formatDate(string $date): string
    {
        return Carbon::parse($date)->format('Y-m-d');
    }
}
