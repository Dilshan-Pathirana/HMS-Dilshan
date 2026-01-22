<?php

namespace App\Application\Services;

use App\Core\Enums\NotificationType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Notification Service
 * Handles SMS, email, and push notifications
 */
class NotificationService extends BaseService
{
    /**
     * Send appointment reminder
     */
    public function sendAppointmentReminder(int $appointmentId, string $timeframe = '24h'): bool
    {
        try {
            $appointment = DB::table('appointments')
                ->join('users as patients', 'appointments.patient_id', '=', 'patients.id')
                ->join('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->where('appointments.id', $appointmentId)
                ->select(
                    'appointments.*',
                    'patients.first_name as patient_first_name',
                    'patients.email as patient_email',
                    'patients.phone_number as patient_phone',
                    'doctors.first_name as doctor_first_name',
                    'doctors.last_name as doctor_last_name'
                )
                ->first();

            if (!$appointment) {
                return false;
            }

            $message = $this->buildAppointmentReminderMessage($appointment, $timeframe);

            // Send via multiple channels
            $this->sendEmail(
                $appointment->patient_email,
                'Appointment Reminder',
                $message
            );

            $this->sendSMS(
                $appointment->patient_phone,
                $message
            );

            // Create notification record
            $this->createNotification([
                'user_id' => $appointment->patient_id,
                'type' => NotificationType::APPOINTMENT_REMINDER->value,
                'title' => 'Appointment Reminder',
                'message' => $message,
                'related_id' => $appointmentId,
                'related_type' => 'appointment',
            ]);

            $this->log('info', 'Appointment reminder sent', [
                'appointment_id' => $appointmentId,
                'timeframe' => $timeframe,
            ]);

            return true;

        } catch (\Throwable $e) {
            $this->log('error', 'Failed to send appointment reminder', [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send appointment confirmation
     */
    public function sendAppointmentConfirmation(int $appointmentId): bool
    {
        try {
            $appointment = DB::table('appointments')
                ->join('users as patients', 'appointments.patient_id', '=', 'patients.id')
                ->join('users as doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->join('medical_centers', 'appointments.center_id', '=', 'medical_centers.id')
                ->where('appointments.id', $appointmentId)
                ->select(
                    'appointments.*',
                    'patients.first_name as patient_first_name',
                    'patients.email as patient_email',
                    'patients.phone_number as patient_phone',
                    'doctors.first_name as doctor_first_name',
                    'doctors.last_name as doctor_last_name',
                    'medical_centers.center_name',
                    'medical_centers.address'
                )
                ->first();

            if (!$appointment) {
                return false;
            }

            $message = $this->buildAppointmentConfirmationMessage($appointment);

            $this->sendEmail(
                $appointment->patient_email,
                'Appointment Confirmation',
                $message
            );

            $this->sendSMS(
                $appointment->patient_phone,
                $message
            );

            $this->createNotification([
                'user_id' => $appointment->patient_id,
                'type' => NotificationType::APPOINTMENT_CONFIRMATION->value,
                'title' => 'Appointment Confirmed',
                'message' => $message,
                'related_id' => $appointmentId,
                'related_type' => 'appointment',
            ]);

            return true;

        } catch (\Throwable $e) {
            $this->log('error', 'Failed to send appointment confirmation', [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send low stock alert
     */
    public function sendLowStockAlert(int $medicationId): bool
    {
        try {
            $medication = DB::table('medications')
                ->join('medical_centers', 'medications.center_id', '=', 'medical_centers.id')
                ->where('medications.id', $medicationId)
                ->select('medications.*', 'medical_centers.center_name')
                ->first();

            if (!$medication) {
                return false;
            }

            // Get center admin
            $admin = DB::table('users')
                ->where('center_id', $medication->center_id)
                ->where('role', 'center_admin')
                ->first();

            if (!$admin) {
                return false;
            }

            $message = "Low Stock Alert: {$medication->medication_name} at {$medication->center_name}. " .
                      "Current stock: {$medication->quantity_in_stock}. Reorder level: {$medication->reorder_level}.";

            $this->sendEmail(
                $admin->email,
                'Low Stock Alert',
                $message
            );

            $this->createNotification([
                'user_id' => $admin->id,
                'type' => NotificationType::REORDER_ALERT->value,
                'title' => 'Low Stock Alert',
                'message' => $message,
                'related_id' => $medicationId,
                'related_type' => 'medication',
            ]);

            return true;

        } catch (\Throwable $e) {
            $this->log('error', 'Failed to send low stock alert', [
                'medication_id' => $medicationId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send email
     */
    private function sendEmail(string $to, string $subject, string $message): void
    {
        // TODO: Implement actual email sending
        // Mail::raw($message, function ($mail) use ($to, $subject) {
        //     $mail->to($to)->subject($subject);
        // });

        $this->log('info', 'Email sent', ['to' => $to, 'subject' => $subject]);
    }

    /**
     * Send SMS
     */
    private function sendSMS(string $phoneNumber, string $message): void
    {
        // TODO: Implement actual SMS sending via Twilio or similar
        $this->log('info', 'SMS sent', ['to' => $phoneNumber]);
    }

    /**
     * Create notification record
     */
    private function createNotification(array $data): int
    {
        return DB::table('notifications')->insertGetId(array_merge($data, [
            'status' => 'sent',
            'sent_at' => now(),
            'created_at' => now(),
        ]));
    }

    /**
     * Build appointment reminder message
     */
    private function buildAppointmentReminderMessage(object $appointment, string $timeframe): string
    {
        $time = $timeframe === '24h' ? '24 hours' : '1 hour';
        
        return "Dear {$appointment->patient_first_name}, this is a reminder that you have an appointment with " .
               "Dr. {$appointment->doctor_first_name} {$appointment->doctor_last_name} in {$time} on " .
               "{$appointment->appointment_date} at {$appointment->appointment_time}. Please arrive 15 minutes early.";
    }

    /**
     * Build appointment confirmation message
     */
    private function buildAppointmentConfirmationMessage(object $appointment): string
    {
        return "Dear {$appointment->patient_first_name}, your appointment has been confirmed with " .
               "Dr. {$appointment->doctor_first_name} {$appointment->doctor_last_name} on " .
               "{$appointment->appointment_date} at {$appointment->appointment_time} at {$appointment->center_name}. " .
               "Booking reference: {$appointment->id}";
    }
}
