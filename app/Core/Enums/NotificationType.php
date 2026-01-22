<?php

namespace App\Core\Enums;

enum NotificationType: string
{
    case APPOINTMENT_REMINDER = 'appointment_reminder';
    case APPOINTMENT_CONFIRMATION = 'appointment_confirmation';
    case APPOINTMENT_CREATED = 'appointment_created';
    case APPOINTMENT_EDITED = 'appointment_edited';
    case APPOINTMENT_CANCELLED = 'appointment_cancelled';
    case APPOINTMENT_RESCHEDULED = 'appointment_rescheduled';
    case PAYMENT_DUE = 'payment_due';
    case REORDER_ALERT = 'reorder_alert';
    case EXPIRY_ALERT = 'expiry_alert';
    case NEW_PATIENT_REGISTRATION = 'new_patient_registration';
    case TEST_RESULT_READY = 'test_result_ready';
    case SESSION_COMPLETED = 'session_completed';
    case GENERAL_UPDATE = 'general_update';
    case PURCHASE_REQUEST_PENDING = 'purchase_request_pending';
    case PURCHASE_REQUEST_APPROVED = 'purchase_request_approved';
    case PURCHASE_REQUEST_REJECTED = 'purchase_request_rejected';

    public function label(): string
    {
        return match ($this) {
            self::APPOINTMENT_REMINDER => 'Appointment Reminder',
            self::APPOINTMENT_CONFIRMATION => 'Appointment Confirmation',
            self::APPOINTMENT_CREATED => 'New Appointment',
            self::APPOINTMENT_EDITED => 'Appointment Updated',
            self::APPOINTMENT_CANCELLED => 'Appointment Cancelled',
            self::APPOINTMENT_RESCHEDULED => 'Appointment Rescheduled',
            self::PAYMENT_DUE => 'Payment Due',
            self::REORDER_ALERT => 'Reorder Alert',
            self::EXPIRY_ALERT => 'Expiry Alert',
            self::NEW_PATIENT_REGISTRATION => 'New Patient Registration',
            self::TEST_RESULT_READY => 'Test Result Ready',
            self::SESSION_COMPLETED => 'Session Completed',
            self::GENERAL_UPDATE => 'General Update',
            self::PURCHASE_REQUEST_PENDING => 'Purchase Request Pending',
            self::PURCHASE_REQUEST_APPROVED => 'Purchase Request Approved',
            self::PURCHASE_REQUEST_REJECTED => 'Purchase Request Rejected',
        };
    }
}
