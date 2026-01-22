<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\Log;

class SmsLog extends Model
{
    use HasUuids;

    protected $table = 'sms_logs';

    protected $fillable = [
        'type',
        'recipient_type',
        'recipient_id',
        'phone_number',
        'phone_masked',
        'message',
        'related_id',
        'related_type',
        'gateway',
        'status',
        'error_message',
        'retry_count',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    // SMS Types
    const TYPE_APPOINTMENT_CANCELLATION = 'appointment_cancellation';
    const TYPE_APPOINTMENT_CONFIRMATION = 'appointment_confirmation';
    const TYPE_APPOINTMENT_REMINDER = 'appointment_reminder';
    const TYPE_APPOINTMENT_RESCHEDULE = 'appointment_reschedule';
    const TYPE_APPOINTMENT_STATUS_UPDATE = 'appointment_status_update';
    const TYPE_PATIENT_CREDENTIALS = 'patient_credentials';
    const TYPE_OTP = 'otp';
    const TYPE_GENERAL = 'general';

    // Recipient Types
    const RECIPIENT_PATIENT = 'patient';
    const RECIPIENT_DOCTOR = 'doctor';
    const RECIPIENT_ADMIN = 'admin';

    // Status
    const STATUS_PENDING = 'pending';
    const STATUS_SENT = 'sent';
    const STATUS_FAILED = 'failed';

    /**
     * Mask phone number for logging (e.g., 0771234567 -> ****4567)
     */
    public static function maskPhoneNumber(string $phone): string
    {
        $length = strlen($phone);
        if ($length <= 4) {
            return str_repeat('*', $length);
        }
        return str_repeat('*', $length - 4) . substr($phone, -4);
    }

    /**
     * Create a log entry for SMS
     */
    public static function createLog(
        string $type,
        string $recipientType,
        ?string $recipientId,
        string $phoneNumber,
        string $message,
        ?string $relatedId = null,
        ?string $relatedType = null,
        string $gateway = 'textware'
    ): self {
        return self::create([
            'type' => $type,
            'recipient_type' => $recipientType,
            'recipient_id' => $recipientId,
            'phone_number' => $phoneNumber,
            'phone_masked' => self::maskPhoneNumber($phoneNumber),
            'message' => $message,
            'related_id' => $relatedId,
            'related_type' => $relatedType,
            'gateway' => $gateway,
            'status' => self::STATUS_PENDING,
        ]);
    }

    /**
     * Mark SMS as sent
     */
    public function markAsSent(): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'sent_at' => now(),
        ]);
    }

    /**
     * Mark SMS as failed
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
            'retry_count' => $this->retry_count + 1,
        ]);
    }

    /**
     * Get summary for audit display
     */
    public function getAuditSummary(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'recipient_type' => $this->recipient_type,
            'phone_masked' => $this->phone_masked,
            'gateway' => $this->gateway,
            'status' => $this->status,
            'sent_at' => $this->sent_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
