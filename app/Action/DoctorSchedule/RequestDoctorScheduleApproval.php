<?php

namespace App\Action\DoctorSchedule;

use App\Models\ApprovalRequest;
use App\Models\Branch;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorSchedule\DoctorSchedule;

class RequestDoctorScheduleApproval
{
    public function __invoke(array $validated): array
    {
        DB::beginTransaction();
        try {
            // Check for conflicting schedules (within 30 minutes before or after)
            $conflicts = $this->checkForConflicts($validated);
            
            if (!empty($conflicts)) {
                DB::rollBack();
                return [
                    'status' => 409,
                    'message' => 'Schedule conflict detected',
                    'conflicts' => $conflicts,
                    'warning' => true
                ];
            }

            // Get branch admin(s) for the selected branch
            $branch = Branch::find($validated['branch_id']);
            if (!$branch) {
                DB::rollBack();
                return CommonResponse::sendBadRequestResponse('Branch not found');
            }

            // Create approval request
            $approvalRequest = ApprovalRequest::create([
                'requested_by' => $validated['doctor_id'],
                'action' => 'create_doctor_schedule',
                'entity_type' => 'doctor_schedule',
                'request_data' => [
                    'doctor_id' => $validated['doctor_id'],
                    'branch_id' => $validated['branch_id'],
                    'schedule_day' => $validated['schedule_day'],
                    'start_time' => $validated['start_time'],
                    'end_time' => $validated['end_time'] ?? null,
                    'max_patients' => $validated['max_patients'],
                    'time_per_patient' => $validated['time_per_patient'] ?? 15,
                ],
                'reason' => 'Doctor schedule creation request',
                'status' => 'pending',
                'requested_at' => now(),
            ]);

            DB::commit();

            return [
                'status' => 200,
                'message' => 'Schedule request submitted successfully. Awaiting branch manager approval.',
                'approval_request_id' => $approvalRequest->id
            ];
        } catch (\Exception $e) {
            Log::error('DoctorSchedule Request Error: ' . $e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }

    /**
     * Check for conflicting schedules within 30 minutes
     * @param array $validated
     * @param string|null $excludeRequestId - ID of the request to exclude (when editing)
     */
    private function checkForConflicts(array $validated, ?string $excludeRequestId = null): array
    {
        $conflicts = [];
        
        $doctorId = $validated['doctor_id'];
        $scheduleDay = $validated['schedule_day'];
        $startTime = $validated['start_time'];
        $endTime = $validated['end_time'] ?? null;
        
        // Convert start time to minutes for comparison
        $startMinutes = $this->timeToMinutes($startTime);
        $endMinutes = $endTime ? $this->timeToMinutes($endTime) : ($startMinutes + ($validated['max_patients'] * ($validated['time_per_patient'] ?? 15)));
        
        // Check for existing schedules for the same doctor on the same day
        $existingSchedules = DoctorSchedule::where('doctor_id', $doctorId)
            ->where('schedule_day', $scheduleDay)
            ->with(['branch' => function($query) {
                $query->select('id', 'center_name');
            }])
            ->get();
        
        foreach ($existingSchedules as $schedule) {
            $existingStartMinutes = $this->timeToMinutes($schedule->start_time);
            
            // Calculate existing end time
            $existingEndMinutes = $schedule->end_time 
                ? $this->timeToMinutes($schedule->end_time)
                : ($existingStartMinutes + ($schedule->max_patients * ($schedule->time_per_patient ?? 15)));
            
            // Check if there's overlap or within 30 minutes
            $bufferMinutes = 30;
            
            // Conflict conditions:
            // 1. New schedule starts during existing schedule (with buffer)
            // 2. New schedule ends during existing schedule (with buffer)
            // 3. New schedule completely encompasses existing schedule
            // 4. Within 30 minutes before or after
            
            $hasConflict = false;
            $conflictType = '';
            
            // Check if new start is within existing schedule + buffer
            if ($startMinutes >= ($existingStartMinutes - $bufferMinutes) && $startMinutes <= ($existingEndMinutes + $bufferMinutes)) {
                $hasConflict = true;
                $conflictType = 'Start time conflicts with existing schedule';
            }
            
            // Check if new end is within existing schedule + buffer
            if ($endMinutes >= ($existingStartMinutes - $bufferMinutes) && $endMinutes <= ($existingEndMinutes + $bufferMinutes)) {
                $hasConflict = true;
                $conflictType = 'End time conflicts with existing schedule';
            }
            
            // Check if new schedule encompasses existing
            if ($startMinutes <= $existingStartMinutes && $endMinutes >= $existingEndMinutes) {
                $hasConflict = true;
                $conflictType = 'Schedule overlaps with existing schedule';
            }
            
            if ($hasConflict) {
                $conflicts[] = [
                    'schedule_id' => $schedule->id,
                    'branch_name' => $schedule->branch->center_name ?? 'Unknown Branch',
                    'day' => $schedule->schedule_day,
                    'start_time' => $schedule->start_time,
                    'end_time' => $this->minutesToTime($existingEndMinutes),
                    'conflict_type' => $conflictType,
                    'message' => "Existing schedule at {$schedule->branch->center_name}: {$schedule->start_time} - " . $this->minutesToTime($existingEndMinutes)
                ];
            }
        }
        
        // Also check pending approval requests for the same doctor and day
        $pendingRequestsQuery = ApprovalRequest::where('requested_by', $doctorId)
            ->where('entity_type', 'doctor_schedule')
            ->where('status', 'pending');
        
        // Exclude the current request if editing
        if ($excludeRequestId) {
            $pendingRequestsQuery->where('id', '!=', $excludeRequestId);
        }
        
        $pendingRequests = $pendingRequestsQuery->get();
            
        foreach ($pendingRequests as $request) {
            $requestData = $request->request_data;
            if (($requestData['schedule_day'] ?? '') === $scheduleDay) {
                $existingStartMinutes = $this->timeToMinutes($requestData['start_time'] ?? '00:00');
                $existingEndMinutes = isset($requestData['end_time']) 
                    ? $this->timeToMinutes($requestData['end_time'])
                    : ($existingStartMinutes + (($requestData['max_patients'] ?? 20) * ($requestData['time_per_patient'] ?? 15)));
                
                $bufferMinutes = 30;
                
                if (($startMinutes >= ($existingStartMinutes - $bufferMinutes) && $startMinutes <= ($existingEndMinutes + $bufferMinutes)) ||
                    ($endMinutes >= ($existingStartMinutes - $bufferMinutes) && $endMinutes <= ($existingEndMinutes + $bufferMinutes))) {
                    $conflicts[] = [
                        'schedule_id' => 'pending_' . $request->id,
                        'branch_name' => 'Pending Approval',
                        'day' => $requestData['schedule_day'],
                        'start_time' => $requestData['start_time'],
                        'end_time' => $this->minutesToTime($existingEndMinutes),
                        'conflict_type' => 'Conflicts with pending schedule request',
                        'message' => "Pending request: {$requestData['start_time']} - " . $this->minutesToTime($existingEndMinutes)
                    ];
                }
            }
        }
        
        return $conflicts;
    }
    
    /**
     * Public method for conflict checking (used by UpdateDoctorScheduleRequest)
     */
    public function checkForConflictsPublic(array $validated, ?string $excludeRequestId = null): array
    {
        return $this->checkForConflicts($validated, $excludeRequestId);
    }

    private function timeToMinutes(string $time): int
    {
        $parts = explode(':', $time);
        return (int)$parts[0] * 60 + (int)($parts[1] ?? 0);
    }
    
    private function minutesToTime(int $minutes): string
    {
        $hours = floor($minutes / 60) % 24;
        $mins = $minutes % 60;
        return sprintf('%02d:%02d', $hours, $mins);
    }
}
