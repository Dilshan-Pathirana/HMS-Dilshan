<?php

namespace App\Action\DoctorSchedule;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Appointment\DoctorScheduleCancellation;

class CancelDoctorEntireDay
{
    public function __invoke(array $cancellationData): array
    {
        try {
            $doctor_id = $cancellationData['doctor_id'];
            $branch_id = $cancellationData['branch_id'] ?? null;
            $date = $cancellationData['date'];
            $reason = $cancellationData['reason'];

            // Get day of week from the provided date
            $dayOfWeek = date('l', strtotime($date)); // Returns day name like "Monday"

            // Get all schedules for this doctor on this day of week
            $schedules = DB::table('doctor_schedules')
                ->where('doctor_id', $doctor_id)
                ->where('schedule_day', $dayOfWeek)
                ->get();

            $cancelledCount = 0;

            if ($schedules->isNotEmpty()) {
                // Cancel each schedule for this specific date
                foreach ($schedules as $schedule) {
                    // Check if cancellation already exists
                    $existingCancellation = DoctorScheduleCancellation::where('schedule_id', $schedule->id)
                        ->where('doctor_id', $doctor_id)
                        ->where('branch_id', $schedule->branch_id)
                        ->where('date', $date)
                        ->first();

                    if (! $existingCancellation) {
                        DoctorScheduleCancellation::create([
                            'schedule_id' => $schedule->id,
                            'doctor_id' => $doctor_id,
                            'branch_id' => $schedule->branch_id,
                            'date' => $date,
                            'reason' => $reason,
                            'status' => 0, // Pending approval
                        ]);
                        $cancelledCount++;
                    }
                }

                if ($cancelledCount === 0) {
                    return CommonResponse::sendBadResponseWithMessage('All schedules for this date have already been requested to be canceled.');
                }

                return CommonResponse::sendSuccessResponse("Successfully created cancellation request for {$cancelledCount} schedule(s) on {$date}.");
            } else {
                // No schedules on this day, create a day-level cancellation
                // Check if day-level cancellation already exists
                $existingDayCancellation = DoctorScheduleCancellation::where('schedule_id', null)
                    ->where('doctor_id', $doctor_id)
                    ->where('date', $date)
                    ->first();

                if ($existingDayCancellation) {
                    return CommonResponse::sendBadResponseWithMessage('This date has already been requested to be canceled.');
                }

                // Determine branch_id - use provided or get doctor's primary branch
                $finalBranchId = $branch_id;
                if (! $finalBranchId) {
                    $doctorBranch = DB::table('doctor_schedules')
                        ->where('doctor_id', $doctor_id)
                        ->first();

                    if ($doctorBranch) {
                        $finalBranchId = $doctorBranch->branch_id;
                    } else {
                        // If no schedules exist at all, get from doctors table
                        $doctor = DB::table('doctors')
                            ->where('user_id', $doctor_id)
                            ->first();

                        if ($doctor && isset($doctor->branch_id)) {
                            $finalBranchId = $doctor->branch_id;
                        } else {
                            return CommonResponse::sendBadResponseWithMessage('Unable to determine branch for cancellation.');
                        }
                    }
                }

                DoctorScheduleCancellation::create([
                    'schedule_id' => null, // Day-level cancellation
                    'doctor_id' => $doctor_id,
                    'branch_id' => $finalBranchId,
                    'date' => $date,
                    'reason' => $reason,
                    'status' => 0, // Pending approval
                ]);

                return CommonResponse::sendSuccessResponse("Successfully created cancellation request for entire day on {$date}.");
            }
        } catch (\Exception $e) {
            Log::error('CancelDoctorEntireDayError: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('Error cancelling entire day.');
        }
    }
}
