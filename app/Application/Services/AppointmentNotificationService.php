<?php

namespace App\Application\Services;

use App\Core\Enums\NotificationType;
use App\Models\Notification;
use App\Models\Appointment\AppointmentBooking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Appointment Notification Service
 * Handles notifications for appointment events (create, edit, cancel, reschedule)
 * Syncs to Patient, Doctor, and Receptionist dashboards
 */
class AppointmentNotificationService
{
    /**
     * Role constants for notification targeting
     */
    const ROLE_PATIENT = 7;      // role_as = 7
    const ROLE_DOCTOR = 3;       // role_as = 3
    const ROLE_RECEPTIONIST = 6; // role_as = 6

    /**
     * Notify all relevant parties when an appointment is created
     */
    public static function notifyAppointmentCreated(
        string $bookingId,
        string $createdByName,
        string $bookingType = 'walk_in'
    ): void {
        try {
            $booking = self::getBookingWithDetails($bookingId);
            if (!$booking) {
                Log::warning("AppointmentNotificationService: Booking not found for ID {$bookingId}");
                return;
            }

            $appointmentDate = Carbon::parse($booking->appointment_date)->format('M d, Y');
            $appointmentTime = Carbon::parse($booking->appointment_time)->format('h:i A');
            $doctorName = "Dr. {$booking->doctor_first_name} {$booking->doctor_last_name}";
            $patientName = "{$booking->patient_first_name} {$booking->patient_last_name}";
            $bookingTypeLabel = ucfirst(str_replace('_', ' ', $bookingType));

            // 1. Notify Patient
            self::createNotification(
                $booking->patient_user_id,
                NotificationType::APPOINTMENT_CREATED,
                'New Appointment Booked',
                "Your appointment with {$doctorName} has been booked for {$appointmentDate} at {$appointmentTime}. Token: #{$booking->token_number}. Booking Type: {$bookingTypeLabel}.",
                $bookingId,
                'appointment_booking'
            );

            // 2. Notify Doctor
            self::createNotification(
                $booking->doctor_id,
                NotificationType::APPOINTMENT_CREATED,
                'New Patient Appointment',
                "New {$bookingTypeLabel} appointment: {$patientName} on {$appointmentDate} at {$appointmentTime}. Token: #{$booking->token_number}. Created by: {$createdByName}.",
                $bookingId,
                'appointment_booking'
            );

            // 3. Notify Receptionists in the branch
            self::notifyBranchReceptionists(
                $booking->branch_id,
                NotificationType::APPOINTMENT_CREATED,
                'New Appointment Created',
                "New {$bookingTypeLabel} booking: {$patientName} with {$doctorName} on {$appointmentDate} at {$appointmentTime}. Token: #{$booking->token_number}.",
                $bookingId
            );

            Log::info("AppointmentNotificationService: Notifications sent for new appointment {$bookingId}");

        } catch (\Throwable $e) {
            Log::error("AppointmentNotificationService: Failed to send create notifications", [
                'booking_id' => $bookingId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify all relevant parties when an appointment is edited/updated
     */
    public static function notifyAppointmentEdited(
        string $bookingId,
        string $editedByName,
        array $changes = []
    ): void {
        try {
            $booking = self::getBookingWithDetails($bookingId);
            if (!$booking) {
                return;
            }

            $appointmentDate = Carbon::parse($booking->appointment_date)->format('M d, Y');
            $appointmentTime = Carbon::parse($booking->appointment_time)->format('h:i A');
            $doctorName = "Dr. {$booking->doctor_first_name} {$booking->doctor_last_name}";
            $patientName = "{$booking->patient_first_name} {$booking->patient_last_name}";

            $changesSummary = self::buildChangesSummary($changes);

            // 1. Notify Patient
            self::createNotification(
                $booking->patient_user_id,
                NotificationType::APPOINTMENT_EDITED,
                'Appointment Updated',
                "Your appointment with {$doctorName} on {$appointmentDate} at {$appointmentTime} has been updated. {$changesSummary}",
                $bookingId,
                'appointment_booking'
            );

            // 2. Notify Doctor
            self::createNotification(
                $booking->doctor_id,
                NotificationType::APPOINTMENT_EDITED,
                'Appointment Updated',
                "Appointment for {$patientName} on {$appointmentDate} at {$appointmentTime} has been updated by {$editedByName}. {$changesSummary}",
                $bookingId,
                'appointment_booking'
            );

            // 3. Notify Receptionists
            self::notifyBranchReceptionists(
                $booking->branch_id,
                NotificationType::APPOINTMENT_EDITED,
                'Appointment Modified',
                "Appointment updated: {$patientName} with {$doctorName} on {$appointmentDate}. Updated by: {$editedByName}. {$changesSummary}",
                $bookingId
            );

            Log::info("AppointmentNotificationService: Edit notifications sent for {$bookingId}");

        } catch (\Throwable $e) {
            Log::error("AppointmentNotificationService: Failed to send edit notifications", [
                'booking_id' => $bookingId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify all relevant parties when an appointment is cancelled
     */
    public static function notifyAppointmentCancelled(
        string $bookingId,
        string $cancelledByName,
        string $cancelledByRole,
        string $reason,
        bool $forDoctorRequest = false
    ): void {
        try {
            $booking = self::getBookingWithDetails($bookingId);
            if (!$booking) {
                return;
            }

            $appointmentDate = Carbon::parse($booking->appointment_date)->format('M d, Y');
            $appointmentTime = Carbon::parse($booking->appointment_time)->format('h:i A');
            $doctorName = "Dr. {$booking->doctor_first_name} {$booking->doctor_last_name}";
            $patientName = "{$booking->patient_first_name} {$booking->patient_last_name}";

            $cancellationNote = $forDoctorRequest 
                ? " (Doctor requested cancellation)" 
                : "";

            // 1. Notify Patient
            self::createNotification(
                $booking->patient_user_id,
                NotificationType::APPOINTMENT_CANCELLED,
                'Appointment Cancelled',
                "Your appointment with {$doctorName} on {$appointmentDate} at {$appointmentTime} has been cancelled.{$cancellationNote} Reason: {$reason}",
                $bookingId,
                'appointment_booking'
            );

            // 2. Notify Doctor
            self::createNotification(
                $booking->doctor_id,
                NotificationType::APPOINTMENT_CANCELLED,
                'Appointment Cancelled',
                "Appointment with {$patientName} on {$appointmentDate} at {$appointmentTime} has been cancelled by {$cancelledByName} ({$cancelledByRole}).{$cancellationNote} Reason: {$reason}",
                $bookingId,
                'appointment_booking'
            );

            // 3. Notify Receptionists
            self::notifyBranchReceptionists(
                $booking->branch_id,
                NotificationType::APPOINTMENT_CANCELLED,
                'Appointment Cancelled',
                "Cancelled: {$patientName} with {$doctorName} on {$appointmentDate}. Cancelled by: {$cancelledByName}.{$cancellationNote} Reason: {$reason}",
                $bookingId
            );

            Log::info("AppointmentNotificationService: Cancellation notifications sent for {$bookingId}");

        } catch (\Throwable $e) {
            Log::error("AppointmentNotificationService: Failed to send cancellation notifications", [
                'booking_id' => $bookingId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify all relevant parties when an appointment is rescheduled
     */
    public static function notifyAppointmentRescheduled(
        string $bookingId,
        string $rescheduledByName,
        string $oldDate,
        string $oldTime,
        string $reason
    ): void {
        try {
            $booking = self::getBookingWithDetails($bookingId);
            if (!$booking) {
                return;
            }

            $newDate = Carbon::parse($booking->appointment_date)->format('M d, Y');
            $newTime = Carbon::parse($booking->appointment_time)->format('h:i A');
            $oldDateFormatted = Carbon::parse($oldDate)->format('M d, Y');
            $oldTimeFormatted = Carbon::parse($oldTime)->format('h:i A');
            $doctorName = "Dr. {$booking->doctor_first_name} {$booking->doctor_last_name}";
            $patientName = "{$booking->patient_first_name} {$booking->patient_last_name}";

            // 1. Notify Patient
            self::createNotification(
                $booking->patient_user_id,
                NotificationType::APPOINTMENT_RESCHEDULED,
                'Appointment Rescheduled',
                "Your appointment with {$doctorName} has been rescheduled from {$oldDateFormatted} {$oldTimeFormatted} to {$newDate} {$newTime}. New Token: #{$booking->token_number}. Reason: {$reason}",
                $bookingId,
                'appointment_booking'
            );

            // 2. Notify Doctor
            self::createNotification(
                $booking->doctor_id,
                NotificationType::APPOINTMENT_RESCHEDULED,
                'Appointment Rescheduled',
                "Appointment for {$patientName} rescheduled from {$oldDateFormatted} {$oldTimeFormatted} to {$newDate} {$newTime}. Rescheduled by: {$rescheduledByName}. Reason: {$reason}",
                $bookingId,
                'appointment_booking'
            );

            // 3. Notify Receptionists
            self::notifyBranchReceptionists(
                $booking->branch_id,
                NotificationType::APPOINTMENT_RESCHEDULED,
                'Appointment Rescheduled',
                "Rescheduled: {$patientName} with {$doctorName} from {$oldDateFormatted} to {$newDate} {$newTime}. By: {$rescheduledByName}. Reason: {$reason}",
                $bookingId
            );

            Log::info("AppointmentNotificationService: Reschedule notifications sent for {$bookingId}");

        } catch (\Throwable $e) {
            Log::error("AppointmentNotificationService: Failed to send reschedule notifications", [
                'booking_id' => $bookingId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get booking with full details for notification messages
     */
    private static function getBookingWithDetails(string $bookingId): ?object
    {
        return DB::table('appointment_bookings')
            ->join('users as doctor', 'appointment_bookings.doctor_id', '=', 'doctor.id')
            ->leftJoin('patients', function ($join) {
                $join->on('appointment_bookings.patient_id', '=', 'patients.user_id')
                     ->orOn('appointment_bookings.patient_id', '=', DB::raw('CAST(patients.id AS TEXT)'));
            })
            ->where('appointment_bookings.id', $bookingId)
            ->select([
                'appointment_bookings.*',
                'doctor.id as doctor_id',
                'doctor.first_name as doctor_first_name',
                'doctor.last_name as doctor_last_name',
                'patients.user_id as patient_user_id',
                'patients.first_name as patient_first_name',
                'patients.last_name as patient_last_name',
            ])
            ->first();
    }

    /**
     * Create a notification record
     */
    private static function createNotification(
        ?string $userId,
        NotificationType $type,
        string $title,
        string $message,
        string $relatedId,
        string $relatedType
    ): void {
        if (!$userId) {
            return;
        }

        try {
            Notification::create([
                'user_id' => $userId,
                'type' => $type->value,
                'title' => $title,
                'message' => $message,
                'related_id' => $relatedId,
                'related_type' => $relatedType,
                'status' => 'sent',
                'channel' => 'in_app',
                'sent_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning("Failed to create notification for user {$userId}: {$e->getMessage()}");
        }
    }

    /**
     * Notify all receptionists in a branch
     */
    private static function notifyBranchReceptionists(
        string $branchId,
        NotificationType $type,
        string $title,
        string $message,
        string $relatedId
    ): void {
        // Get all receptionists in the branch (role_as = 6)
        $receptionists = DB::table('users')
            ->where('branch_id', $branchId)
            ->where('role_as', self::ROLE_RECEPTIONIST)
            ->where('status', 'active')
            ->pluck('id');

        foreach ($receptionists as $receptionistId) {
            self::createNotification(
                $receptionistId,
                $type,
                $title,
                $message,
                $relatedId,
                'appointment_booking'
            );
        }
    }

    /**
     * Build a human-readable changes summary
     */
    private static function buildChangesSummary(array $changes): string
    {
        if (empty($changes)) {
            return '';
        }

        $summaryParts = [];
        
        if (isset($changes['date'])) {
            $summaryParts[] = "Date: {$changes['date']['from']} → {$changes['date']['to']}";
        }
        if (isset($changes['time'])) {
            $summaryParts[] = "Time: {$changes['time']['from']} → {$changes['time']['to']}";
        }
        if (isset($changes['doctor'])) {
            $summaryParts[] = "Doctor: {$changes['doctor']['from']} → {$changes['doctor']['to']}";
        }
        if (isset($changes['status'])) {
            $summaryParts[] = "Status: {$changes['status']['from']} → {$changes['status']['to']}";
        }

        return empty($summaryParts) ? '' : 'Changes: ' . implode(', ', $summaryParts);
    }
}
