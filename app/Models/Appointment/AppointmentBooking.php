<?php

namespace App\Models\Appointment;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\AllUsers\User;

class AppointmentBooking extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'appointment_bookings';

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'branch_id',
        'schedule_id',
        'appointment_date',
        'appointment_time',
        'slot_number',
        'token_number',
        'appointment_type',
        'booking_type',
        'status',
        'payment_status',
        'payment_method',
        'payment_id',
        'booking_fee',
        'amount_paid',
        'payment_date',
        'booked_by',
        'booked_by_role',
        'notes',
        'cancellation_reason',
        'cancelled_by',
        'cancelled_by_role',
        'reschedule_count',
        'patient_reschedule_count',
        'admin_granted_reschedule_count',
        'cancelled_by_admin_for_doctor',
        'original_appointment_id',
        'checked_in_at',
        'session_started_at',
        'completed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'booking_fee' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'payment_date' => 'datetime',
        'checked_in_at' => 'datetime',
        'session_started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'cancelled_by_admin_for_doctor' => 'boolean',
    ];

    // Status constants
    const STATUS_PENDING_PAYMENT = 'pending_payment';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_CHECKED_IN = 'checked_in';
    const STATUS_IN_SESSION = 'in_session';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_NO_SHOW = 'no_show';
    const STATUS_RESCHEDULED = 'rescheduled';
    const STATUS_EXPIRED = 'expired'; // For expired pending payments

    // Payment status constants
    const PAYMENT_PENDING = 'pending';
    const PAYMENT_PAID = 'paid';
    const PAYMENT_REFUNDED = 'refunded';
    const PAYMENT_WAIVED = 'waived';
    const PAYMENT_EXPIRED = 'expired'; // For expired payments

    // Booking type constants
    const BOOKING_ONLINE = 'online';
    const BOOKING_WALK_IN = 'walk_in';

    // Relationships
    public function patient(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Patient::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Branch::class, 'branch_id');
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(\App\Models\DoctorSchedule\DoctorSchedule::class, 'schedule_id');
    }

    public function bookedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booked_by');
    }

    public function cancelledByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function originalAppointment(): BelongsTo
    {
        return $this->belongsTo(self::class, 'original_appointment_id');
    }

    public function rescheduledAppointments(): HasMany
    {
        return $this->hasMany(self::class, 'original_appointment_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(AppointmentLog::class, 'appointment_id');
    }

    // Scopes
    public function scopeConfirmed($query)
    {
        return $query->where('status', self::STATUS_CONFIRMED);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('appointment_date', '>=', now()->toDateString())
                     ->whereIn('status', [self::STATUS_CONFIRMED, self::STATUS_PENDING_PAYMENT]);
    }

    public function scopeForDoctor($query, string $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    public function scopeForBranch($query, string $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeForDate($query, string $date)
    {
        return $query->whereDate('appointment_date', $date);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING_PAYMENT);
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING_PAYMENT;
    }

    public function isConfirmed(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

    public function canBeCheckedIn(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING_PAYMENT,
            self::STATUS_CONFIRMED
        ]);
    }

    public function canBeRescheduled(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

    /**
     * Check reschedule eligibility for patient with comprehensive rules
     * 
     * Rules:
     * - 24-hour advance notice required
     * - Normal appointments: max 1 patient-initiated reschedule
     * - Admin-cancelled (for doctor): max 2 reschedules allowed
     * 
     * @return array{can_reschedule: bool, reason: string|null, remaining_attempts: int, max_attempts: int, is_admin_cancelled: bool}
     */
    public function getRescheduleEligibility(): array
    {
        // Base check: must be confirmed status
        if ($this->status !== self::STATUS_CONFIRMED) {
            return [
                'can_reschedule' => false,
                'reason' => 'Only confirmed appointments can be rescheduled',
                'remaining_attempts' => 0,
                'max_attempts' => 0,
                'is_admin_cancelled' => false,
            ];
        }

        // 24-hour advance notice check
        $appointmentDateTime = \Carbon\Carbon::parse(
            $this->appointment_date->format('Y-m-d') . ' ' . $this->appointment_time
        );
        $minRescheduleTime = now()->addHours(24);

        if ($appointmentDateTime->lte($minRescheduleTime)) {
            $hoursRemaining = now()->diffInHours($appointmentDateTime, false);
            return [
                'can_reschedule' => false,
                'reason' => "Rescheduling requires 24-hour advance notice. Your appointment is in {$hoursRemaining} hours.",
                'remaining_attempts' => 0,
                'max_attempts' => 0,
                'is_admin_cancelled' => $this->cancelled_by_admin_for_doctor ?? false,
            ];
        }

        // Check if this is an admin-cancelled appointment (special 2-reschedule allowance)
        $isAdminCancelled = $this->cancelled_by_admin_for_doctor ?? false;
        
        if ($isAdminCancelled) {
            // Admin-cancelled appointments get 2 reschedules
            $maxAttempts = 2;
            $currentCount = $this->admin_granted_reschedule_count ?? 0;
            $remaining = max(0, $maxAttempts - $currentCount);

            if ($remaining <= 0) {
                return [
                    'can_reschedule' => false,
                    'reason' => 'You have used all 2 reschedule attempts allowed for this admin-cancelled appointment.',
                    'remaining_attempts' => 0,
                    'max_attempts' => $maxAttempts,
                    'is_admin_cancelled' => true,
                ];
            }

            return [
                'can_reschedule' => true,
                'reason' => null,
                'remaining_attempts' => $remaining,
                'max_attempts' => $maxAttempts,
                'is_admin_cancelled' => true,
            ];
        } else {
            // Normal appointments get 1 patient-initiated reschedule
            $maxAttempts = 1;
            $currentCount = $this->patient_reschedule_count ?? 0;
            $remaining = max(0, $maxAttempts - $currentCount);

            if ($remaining <= 0) {
                return [
                    'can_reschedule' => false,
                    'reason' => 'You have already used your 1 allowed reschedule for this appointment.',
                    'remaining_attempts' => 0,
                    'max_attempts' => $maxAttempts,
                    'is_admin_cancelled' => false,
                ];
            }

            return [
                'can_reschedule' => true,
                'reason' => null,
                'remaining_attempts' => $remaining,
                'max_attempts' => $maxAttempts,
                'is_admin_cancelled' => false,
            ];
        }
    }

    /**
     * Check if 24-hour rule is satisfied for rescheduling
     */
    public function meetsReschedule24HourRule(): bool
    {
        $appointmentDateTime = \Carbon\Carbon::parse(
            $this->appointment_date->format('Y-m-d') . ' ' . $this->appointment_time
        );
        return $appointmentDateTime->gt(now()->addHours(24));
    }

    /**
     * Get remaining reschedule attempts for patient
     */
    public function getRemainingPatientReschedules(): int
    {
        $isAdminCancelled = $this->cancelled_by_admin_for_doctor ?? false;
        
        if ($isAdminCancelled) {
            return max(0, 2 - ($this->admin_granted_reschedule_count ?? 0));
        }
        
        return max(0, 1 - ($this->patient_reschedule_count ?? 0));
    }

    /**
     * Check if there's a duplicate appointment
     */
    public static function hasDuplicate(
        string $patientId,
        string $doctorId,
        string $date,
        ?string $excludeId = null
    ): bool {
        $query = self::where('patient_id', $patientId)
            ->where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $date)
            ->whereNotIn('status', [self::STATUS_CANCELLED, self::STATUS_RESCHEDULED]);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Clean up stale pending_payment bookings older than specified minutes.
     * These are bookings where payment was never completed.
     * 
     * @param int $expirationMinutes How long before pending bookings expire (default: 30 minutes)
     * @return int Number of bookings cancelled
     */
    public static function cleanupStalePendingBookings(int $expirationMinutes = 30): int
    {
        $expiredBookings = self::where('status', self::STATUS_PENDING_PAYMENT)
            ->where('created_at', '<', now()->subMinutes($expirationMinutes))
            ->get();

        $count = 0;
        foreach ($expiredBookings as $booking) {
            $booking->update([
                'status' => self::STATUS_CANCELLED,
                'payment_status' => 'expired',
                'cancellation_reason' => 'Payment not completed within ' . $expirationMinutes . ' minutes',
                'cancelled_at' => now(),
            ]);
            $count++;
        }

        if ($count > 0) {
            \Illuminate\Support\Facades\Log::info("Cleaned up {$count} stale pending_payment bookings");
        }

        return $count;
    }

    /**
     * Check if slot is available.
     * Excludes cancelled, rescheduled, and stale pending_payment bookings.
     */
    public static function isSlotAvailable(
        string $doctorId,
        string $date,
        int $slotNumber,
        ?string $branchId = null,
        ?string $excludeId = null
    ): bool {
        // Only consider bookings that are not expired pending payments (older than 30 mins)
        $staleCutoff = now()->subMinutes(30);
        
        // NOTE: The unique constraint is on (doctor_id, appointment_date, slot_number) WITHOUT branch_id
        // So we check globally for the doctor/date/slot combination, ignoring branch
        // This ensures a doctor cannot be double-booked even across branches
        $query = self::where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $date)
            ->where('slot_number', $slotNumber)
            ->whereNotIn('status', [self::STATUS_CANCELLED, self::STATUS_RESCHEDULED])
            ->where(function ($q) use ($staleCutoff) {
                // Include if: NOT pending_payment, OR pending_payment but created within last 30 mins
                $q->where('status', '!=', self::STATUS_PENDING_PAYMENT)
                  ->orWhere('created_at', '>=', $staleCutoff);
            });

        // Note: branchId parameter kept for API compatibility but not used in query
        // since the unique constraint is doctor-wide, not per-branch

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return !$query->exists();
    }

    /**
     * Get next available token number for a doctor on a date
     */
    public static function getNextTokenNumber(string $doctorId, string $branchId, string $date): int
    {
        $maxToken = self::where('doctor_id', $doctorId)
            ->where('branch_id', $branchId)
            ->whereDate('appointment_date', $date)
            ->whereNotIn('status', [self::STATUS_CANCELLED, self::STATUS_RESCHEDULED])
            ->max('token_number');

        return ($maxToken ?? 0) + 1;
    }
}
