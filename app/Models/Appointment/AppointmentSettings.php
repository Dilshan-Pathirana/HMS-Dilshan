<?php

namespace App\Models\Appointment;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentSettings extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'appointment_settings';

    protected $fillable = [
        'branch_id',
        'max_advance_booking_days',
        'min_advance_booking_hours',
        'default_max_patients_per_session',
        'default_time_per_patient',
        'allow_walk_in',
        'require_payment_for_online',
        'allow_cash_payment',
        'allow_reschedule',
        'max_reschedule_count',
        'reschedule_advance_hours',
        'allow_patient_cancellation',
        'cancellation_advance_hours',
        'refund_on_cancellation',
        'cancellation_fee_percentage',
        'default_booking_fee',
        'walk_in_fee',
        'send_sms_confirmation',
        'send_sms_reminder',
        'reminder_hours_before',
        'send_email_confirmation',
    ];

    protected $casts = [
        'allow_walk_in' => 'boolean',
        'require_payment_for_online' => 'boolean',
        'allow_cash_payment' => 'boolean',
        'allow_reschedule' => 'boolean',
        'allow_patient_cancellation' => 'boolean',
        'refund_on_cancellation' => 'boolean',
        'send_sms_confirmation' => 'boolean',
        'send_sms_reminder' => 'boolean',
        'send_email_confirmation' => 'boolean',
        'default_booking_fee' => 'decimal:2',
        'walk_in_fee' => 'decimal:2',
        'cancellation_fee_percentage' => 'decimal:2',
    ];

    // Relationship
    public function branch(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Branch::class, 'branch_id');
    }

    /**
     * Get settings for a branch, or create default settings
     */
    public static function getForBranch(string $branchId): self
    {
        return self::firstOrCreate(
            ['branch_id' => $branchId],
            [
                'max_advance_booking_days' => 30,
                'min_advance_booking_hours' => 1,
                'default_max_patients_per_session' => 20,
                'default_time_per_patient' => 15,
                'allow_walk_in' => true,
                'require_payment_for_online' => true,
                'allow_cash_payment' => true,
                'allow_reschedule' => true,
                'max_reschedule_count' => 1,
                'reschedule_advance_hours' => 24,
                'allow_patient_cancellation' => true,
                'cancellation_advance_hours' => 24,
                'refund_on_cancellation' => true,
                'cancellation_fee_percentage' => 0,
                'default_booking_fee' => 500.00,
                'walk_in_fee' => 0,
                'send_sms_confirmation' => true,
                'send_sms_reminder' => true,
                'reminder_hours_before' => 24,
                'send_email_confirmation' => true,
            ]
        );
    }

    /**
     * Check if a date is within booking limit
     */
    public function isDateWithinBookingLimit(string $date): bool
    {
        $appointmentDate = \Carbon\Carbon::parse($date);
        $maxDate = now()->addDays($this->max_advance_booking_days);
        $minDate = now()->addHours($this->min_advance_booking_hours);

        return $appointmentDate->between($minDate, $maxDate);
    }

    /**
     * Get maximum allowed booking date
     */
    public function getMaxBookingDate(): \Carbon\Carbon
    {
        return now()->addDays($this->max_advance_booking_days);
    }

    /**
     * Get minimum allowed booking date/time
     */
    public function getMinBookingDateTime(): \Carbon\Carbon
    {
        return now()->addHours($this->min_advance_booking_hours);
    }

    /**
     * Check if cancellation is allowed for an appointment
     */
    public function canCancelAppointment(string $appointmentDate, string $appointmentTime): bool
    {
        if (!$this->allow_patient_cancellation) {
            return false;
        }

        $appointmentDateTime = \Carbon\Carbon::parse($appointmentDate . ' ' . $appointmentTime);
        $minCancellationTime = now()->addHours($this->cancellation_advance_hours);

        return $appointmentDateTime->gt($minCancellationTime);
    }

    /**
     * Check if reschedule is allowed
     */
    public function canReschedule(int $currentRescheduleCount): bool
    {
        return $this->allow_reschedule && $currentRescheduleCount < $this->max_reschedule_count;
    }
}
