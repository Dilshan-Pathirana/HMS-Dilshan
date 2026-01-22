<?php

namespace App\Application\Services;

use App\Core\Exceptions\BusinessLogicException;
use App\Core\Exceptions\ResourceNotFoundException;
use App\Application\DTOs\CreateAppointmentDTO;
use App\Domain\Events\AppointmentBookedEvent;
use Illuminate\Support\Facades\DB;

/**
 * Appointment Service
 * Handles appointment booking, rescheduling, cancellation, and reminders
 */
class AppointmentService extends BaseService
{
    /**
     * Book new appointment
     */
    public function bookAppointment(CreateAppointmentDTO $dto): array
    {
        try {
            // Validate appointment date is not in the past
            $appointmentDateTime = $dto->appointmentDate . ' ' . $dto->appointmentTime;
            if (strtotime($appointmentDateTime) < time()) {
                throw new BusinessLogicException('Cannot book appointment in the past');
            }

            // Check doctor availability
            if (!$this->isDoctorAvailable($dto->doctorId, $dto->appointmentDate, $dto->appointmentTime)) {
                throw new BusinessLogicException('Doctor is not available at this time');
            }

            // Check if maximum daily sessions reached
            if ($this->isMaxSessionsReached($dto->doctorId, $dto->appointmentDate)) {
                throw new BusinessLogicException('Maximum sessions reached for this date');
            }

            // Create appointment
            $appointmentId = DB::table('appointments')->insertGetId([
                'patient_id' => $dto->patientId,
                'doctor_id' => $dto->doctorId,
                'center_id' => $dto->centerId,
                'appointment_date' => $dto->appointmentDate,
                'appointment_time' => $dto->appointmentTime,
                'appointment_type' => $dto->appointmentType,
                'booking_fee' => $dto->bookingFee,
                'status' => 'booked',
                'payment_status' => 'pending',
                'notes' => $dto->notes,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $appointment = $this->getAppointment($appointmentId);

            // Dispatch domain event
            $this->dispatchDomainEvent(new AppointmentBookedEvent(
                (string) $appointmentId,
                $appointment
            ));

            $this->log('info', 'Appointment booked', [
                'appointment_id' => $appointmentId,
                'patient_id' => $dto->patientId,
            ]);

            return $appointment;

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get appointment details
     */
    public function getAppointment(int $appointmentId): array
    {
        $appointment = DB::table('appointments')
            ->where('id', $appointmentId)
            ->first();

        if (!$appointment) {
            throw new ResourceNotFoundException('Appointment', $appointmentId);
        }

        return (array) $appointment;
    }

    /**
     * Cancel appointment
     */
    public function cancelAppointment(int $appointmentId, string $reason): array
    {
        $appointment = $this->getAppointment($appointmentId);

        // Check if appointment can be canceled (36 hours rule)
        $appointmentDateTime = $appointment['appointment_date'] . ' ' . $appointment['appointment_time'];
        $hoursUntilAppointment = (strtotime($appointmentDateTime) - time()) / 3600;

        if ($hoursUntilAppointment < 36) {
            throw new BusinessLogicException('Cannot cancel appointment within 36 hours of scheduled time');
        }

        DB::table('appointments')
            ->where('id', $appointmentId)
            ->update([
                'status' => 'canceled',
                'cancellation_reason' => $reason,
                'canceled_at' => now(),
                'updated_at' => now(),
            ]);

        $this->log('info', 'Appointment canceled', [
            'appointment_id' => $appointmentId,
            'reason' => $reason,
        ]);

        return $this->getAppointment($appointmentId);
    }

    /**
     * Reschedule appointment
     */
    public function rescheduleAppointment(int $appointmentId, string $newDate, string $newTime): array
    {
        $appointment = $this->getAppointment($appointmentId);

        // Check 36 hours rule
        $currentDateTime = $appointment['appointment_date'] . ' ' . $appointment['appointment_time'];
        $hoursUntilAppointment = (strtotime($currentDateTime) - time()) / 3600;

        if ($hoursUntilAppointment < 36) {
            throw new BusinessLogicException('Cannot reschedule appointment within 36 hours of scheduled time');
        }

        // Check new time availability
        if (!$this->isDoctorAvailable($appointment['doctor_id'], $newDate, $newTime)) {
            throw new BusinessLogicException('Doctor is not available at the new time');
        }

        DB::table('appointments')
            ->where('id', $appointmentId)
            ->update([
                'appointment_date' => $newDate,
                'appointment_time' => $newTime,
                'status' => 'rescheduled',
                'updated_at' => now(),
            ]);

        $this->log('info', 'Appointment rescheduled', [
            'appointment_id' => $appointmentId,
            'new_date' => $newDate,
            'new_time' => $newTime,
        ]);

        return $this->getAppointment($appointmentId);
    }

    /**
     * Check doctor availability
     */
    private function isDoctorAvailable(string $doctorId, string $date, string $time): bool
    {
        // Check if doctor has existing appointment at this time
        $existingAppointment = DB::table('appointments')
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->where('appointment_time', $time)
            ->whereIn('status', ['booked', 'checked_in', 'in_session'])
            ->exists();

        if ($existingAppointment) {
            return false;
        }

        // Check doctor's schedule
        $schedule = DB::table('doctor_schedules')
            ->where('doctor_id', $doctorId)
            ->where('date', $date)
            ->where('is_available', true)
            ->first();

        return $schedule !== null;
    }

    /**
     * Check if maximum sessions reached for the day
     */
    private function isMaxSessionsReached(string $doctorId, string $date): bool
    {
        $maxSessions = DB::table('doctor_schedules')
            ->where('doctor_id', $doctorId)
            ->where('date', $date)
            ->value('max_sessions') ?? 20;

        $bookedSessions = DB::table('appointments')
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->whereIn('status', ['booked', 'checked_in', 'in_session'])
            ->count();

        return $bookedSessions >= $maxSessions;
    }

    /**
     * Get appointments by patient
     */
    public function getPatientAppointments(int $patientId): array
    {
        return DB::table('appointments')
            ->where('patient_id', $patientId)
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Get appointments by doctor for a specific date
     */
    public function getDoctorAppointments(int $doctorId, string $date): array
    {
        return DB::table('appointments')
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->orderBy('appointment_time')
            ->get()
            ->toArray();
    }

    /**
     * Check in patient for appointment
     */
    public function checkIn(int $appointmentId): array
    {
        DB::table('appointments')
            ->where('id', $appointmentId)
            ->update([
                'status' => 'checked_in',
                'checked_in_at' => now(),
                'updated_at' => now(),
            ]);

        $this->log('info', 'Patient checked in', ['appointment_id' => $appointmentId]);

        return $this->getAppointment($appointmentId);
    }
}
