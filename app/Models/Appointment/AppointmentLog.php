<?php

namespace App\Models\Appointment;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\AllUsers\User;

class AppointmentLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'appointment_logs';

    public $timestamps = false;

    protected $fillable = [
        'appointment_id',
        'branch_id',
        'action',
        'previous_status',
        'new_status',
        'performed_by',
        'performed_by_role',
        'reason',
        'metadata',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    // Action constants
    const ACTION_CREATED = 'created';
    const ACTION_CONFIRMED = 'confirmed';
    const ACTION_PAYMENT_RECEIVED = 'payment_received';
    const ACTION_PAYMENT_UPDATED = 'payment_updated';
    const ACTION_CHECKED_IN = 'checked_in';
    const ACTION_SESSION_STARTED = 'session_started';
    const ACTION_COMPLETED = 'completed';
    const ACTION_CANCELLED = 'cancelled';
    const ACTION_RESCHEDULED = 'rescheduled';
    const ACTION_NO_SHOW = 'no_show';
    const ACTION_MODIFIED = 'modified';
    const ACTION_REFUNDED = 'refunded';
    const ACTION_STATUS_CHANGED = 'status_changed';

    // Role constants
    const ROLE_PATIENT = 'patient';
    const ROLE_DOCTOR = 'doctor';
    const ROLE_RECEPTIONIST = 'receptionist';
    const ROLE_BRANCH_ADMIN = 'branch_admin';
    const ROLE_SUPER_ADMIN = 'super_admin';
    const ROLE_SYSTEM = 'system';

    // Relationships
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(AppointmentBooking::class, 'appointment_id');
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Create a log entry for an appointment action
     */
    public static function log(
        string $appointmentId,
        string $action,
        string $performedBy,
        string $performedByRole,
        ?string $previousStatus = null,
        ?string $newStatus = null,
        ?string $reason = null,
        ?array $metadata = null
    ): self {
        return self::create([
            'appointment_id' => $appointmentId,
            'action' => $action,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'performed_by' => $performedBy,
            'performed_by_role' => $performedByRole,
            'reason' => $reason,
            'metadata' => $metadata,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }

    /**
     * Get formatted action label
     */
    public function getActionLabel(): string
    {
        $labels = [
            self::ACTION_CREATED => 'Appointment Created',
            self::ACTION_CONFIRMED => 'Appointment Confirmed',
            self::ACTION_PAYMENT_RECEIVED => 'Payment Received',
            self::ACTION_CHECKED_IN => 'Patient Checked In',
            self::ACTION_SESSION_STARTED => 'Session Started',
            self::ACTION_COMPLETED => 'Appointment Completed',
            self::ACTION_CANCELLED => 'Appointment Cancelled',
            self::ACTION_RESCHEDULED => 'Appointment Rescheduled',
            self::ACTION_NO_SHOW => 'Marked as No-Show',
            self::ACTION_MODIFIED => 'Appointment Modified',
            self::ACTION_REFUNDED => 'Payment Refunded',
        ];

        return $labels[$this->action] ?? ucfirst($this->action);
    }
}
