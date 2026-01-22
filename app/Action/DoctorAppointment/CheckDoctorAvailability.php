<?php

namespace App\Action\DoctorAppointment;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Appointment\DoctorScheduleCancellation;

class CheckDoctorAvailability
{
    public function __invoke(array $validatedData): array
    {
        try {
            $doctorId = $validatedData['doctor_id'];
            $appointmentDate = $validatedData['appointment_date'];
            $scheduleDay = $validatedData['schedule_day'];

            $doctorSchedule = $this->getDoctorSchedule($doctorId, $scheduleDay);

            if (! $doctorSchedule) {
                return CommonResponse::getNotFoundResponse('DoctorSchedule');
            }

            $cancellationResponse = $this->checkScheduleCancellation($doctorId, $doctorSchedule->branch_id, $appointmentDate);
            if ($cancellationResponse) {
                return $cancellationResponse;
            }

            $bookedAppointments = $this->getBookedAppointments($doctorId, $appointmentDate);
            $allSlots = range(1, $doctorSchedule->max_patients);
            $availableSlots = array_values(array_diff($allSlots, $bookedAppointments));

            return CommonResponse::sendSuccessResponseWithData('data', (object) [
                'schedule_day' => $doctorSchedule->schedule_day,
                'start_time' => $doctorSchedule->start_time,
                'branch_id' => $doctorSchedule->branch_id,
                'all_slots' => $allSlots,
                'booked_slots' => $bookedAppointments,
                'available_slots' => $availableSlots,
            ]);
        } catch (\Exception $e) {
            Log::error('CheckDoctorAvailabilityError: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('An error occurred while checking doctor availability.');
        }
    }

    private function getDoctorSchedule(string $doctorId, string $scheduleDay): ?object
    {
        return DB::table('doctor_schedules')
            ->where('doctor_id', $doctorId)
            ->where('schedule_day', $scheduleDay)
            ->select('id', 'schedule_day', 'max_patients', 'start_time', 'branch_id')
            ->first();
    }

    private function checkScheduleCancellation(string $doctorId, string $branchId, string $appointmentDate): ?array
    {
        $scheduleCancellation = DoctorScheduleCancellation::where('doctor_id', $doctorId)
            ->where('branch_id', $branchId)
            ->where('date', $appointmentDate)
            ->where('status', 1)
            ->first();

        if ($scheduleCancellation) {
            return CommonResponse::sendBadResponseWithMessage('Doctor schedule is cancelled for this date.');
        }

        return null;
    }

    private function getBookedAppointments(string $doctorId, string $appointmentDate): array
    {
        $staleCutoff = now()->subMinutes(30);
        
        return DB::table('appointment_bookings')
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', $appointmentDate)
            ->whereNotIn('status', ['cancelled', 'rescheduled'])
            ->where(function ($q) use ($staleCutoff) {
                // Include if: NOT pending_payment, OR pending_payment created within last 30 mins
                $q->where('status', '!=', 'pending_payment')
                  ->orWhere('created_at', '>=', $staleCutoff);
            })
            ->pluck('slot_number')
            ->toArray();
    }
}
