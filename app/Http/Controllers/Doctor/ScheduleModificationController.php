<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ScheduleModificationController extends Controller
{
    /**
     * Get all modification requests for a doctor
     */
    public function getModificationRequests(Request $request, string $doctorId)
    {
        try {
            $status = $request->query('status', 'all');
            
            $query = DB::table('schedule_modification_requests')
                ->leftJoin('doctor_schedules', 'schedule_modification_requests.schedule_id', '=', 'doctor_schedules.id')
                ->leftJoin('branches', 'schedule_modification_requests.branch_id', '=', 'branches.id')
                ->leftJoin('users as approver', 'schedule_modification_requests.approved_by', '=', 'approver.id')
                ->where('schedule_modification_requests.doctor_id', $doctorId)
                ->select([
                    'schedule_modification_requests.*',
                    'doctor_schedules.schedule_day',
                    'doctor_schedules.start_time as schedule_start_time',
                    'doctor_schedules.end_time as schedule_end_time',
                    'branches.center_name as branch_name',
                    'approver.first_name as approver_first_name',
                    'approver.last_name as approver_last_name'
                ])
                ->orderBy('schedule_modification_requests.created_at', 'desc');
            
            if ($status !== 'all') {
                $query->where('schedule_modification_requests.status', $status);
            }
            
            $requests = $query->get();
            
            // Transform the data
            $formattedRequests = $requests->map(function ($req) {
                return [
                    'id' => $req->id,
                    'doctor_id' => $req->doctor_id,
                    'branch_id' => $req->branch_id,
                    'branch_name' => $req->branch_name,
                    'schedule_id' => $req->schedule_id,
                    'parent_request_id' => $req->parent_request_id ?? null,
                    'schedule_day' => $req->schedule_day,
                    'schedule_start_time' => $req->schedule_start_time,
                    'schedule_end_time' => $req->schedule_end_time,
                    'request_type' => $req->request_type,
                    'start_date' => $req->start_date,
                    'end_date' => $req->end_date,
                    'new_start_time' => $req->new_start_time,
                    'new_end_time' => $req->new_end_time,
                    'new_max_patients' => $req->new_max_patients,
                    'reason' => $req->reason,
                    'status' => $req->status,
                    'approved_by' => $req->approved_by,
                    'approver_name' => $req->approver_first_name 
                        ? trim($req->approver_first_name . ' ' . $req->approver_last_name)
                        : null,
                    'approval_notes' => $req->approval_notes,
                    'approved_at' => $req->approved_at,
                    'created_at' => $req->created_at,
                    'updated_at' => $req->updated_at,
                ];
            });
            
            // Count by status
            $counts = [
                'pending' => $formattedRequests->where('status', 'pending')->count(),
                'approved' => $formattedRequests->where('status', 'approved')->count(),
                'rejected' => $formattedRequests->where('status', 'rejected')->count(),
                'total' => $formattedRequests->count(),
            ];
            
            return response()->json([
                'status' => 200,
                'requests' => $formattedRequests,
                'counts' => $counts
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching modification requests: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch modification requests',
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Create a new modification request
     */
    public function createModificationRequest(Request $request)
    {
        try {
            $validated = $request->validate([
                'doctor_id' => 'required|string',
                'branch_id' => 'required|string',
                'schedule_id' => 'nullable|string',
                'request_type' => 'required|in:block_date,block_schedule,delay_start,limit_appointments,early_end,cancel_block',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'new_start_time' => 'nullable|string',
                'new_end_time' => 'nullable|string',
                'new_max_patients' => 'nullable|integer|min:1',
                'reason' => 'required|string|max:1000',
                'parent_request_id' => 'nullable|string',
            ]);
            
            $id = Str::uuid()->toString();
            
            DB::table('schedule_modification_requests')->insert([
                'id' => $id,
                'doctor_id' => $validated['doctor_id'],
                'branch_id' => $validated['branch_id'],
                'schedule_id' => $validated['schedule_id'] ?? null,
                'parent_request_id' => $validated['parent_request_id'] ?? null,
                'request_type' => $validated['request_type'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? $validated['start_date'],
                'new_start_time' => $validated['new_start_time'] ?? null,
                'new_end_time' => $validated['new_end_time'] ?? null,
                'new_max_patients' => $validated['new_max_patients'] ?? null,
                'reason' => $validated['reason'],
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // If this is a cancellation request, update the parent request's status
            if ($validated['request_type'] === 'cancel_block' && !empty($validated['parent_request_id'])) {
                DB::table('schedule_modification_requests')
                    ->where('id', $validated['parent_request_id'])
                    ->update([
                        'status' => 'pending_cancellation',
                        'updated_at' => now()
                    ]);
            }
            
            return response()->json([
                'status' => 201,
                'message' => 'Modification request submitted successfully',
                'id' => $id
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating modification request: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create modification request',
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Update a modification request (only if pending)
     */
    public function updateModificationRequest(Request $request, string $id)
    {
        try {
            $existingRequest = DB::table('schedule_modification_requests')
                ->where('id', $id)
                ->first();
            
            if (!$existingRequest) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Modification request not found'
                ]);
            }
            
            if ($existingRequest->status !== 'pending') {
                return response()->json([
                    'status' => 400,
                    'message' => 'Only pending requests can be edited'
                ]);
            }
            
            $validated = $request->validate([
                'schedule_id' => 'nullable|string',
                'request_type' => 'sometimes|in:block_date,block_schedule,delay_start,limit_appointments,early_end',
                'start_date' => 'sometimes|date',
                'end_date' => 'nullable|date',
                'new_start_time' => 'nullable|string',
                'new_end_time' => 'nullable|string',
                'new_max_patients' => 'nullable|integer|min:1',
                'reason' => 'sometimes|string|max:1000',
            ]);
            
            $updateData = array_filter([
                'schedule_id' => $validated['schedule_id'] ?? null,
                'request_type' => $validated['request_type'] ?? null,
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'new_start_time' => $validated['new_start_time'] ?? null,
                'new_end_time' => $validated['new_end_time'] ?? null,
                'new_max_patients' => $validated['new_max_patients'] ?? null,
                'reason' => $validated['reason'] ?? null,
                'updated_at' => now(),
            ], function ($value) {
                return $value !== null;
            });
            
            DB::table('schedule_modification_requests')
                ->where('id', $id)
                ->update($updateData);
            
            return response()->json([
                'status' => 200,
                'message' => 'Modification request updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating modification request: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update modification request',
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Delete a modification request (only if pending)
     */
    public function deleteModificationRequest(string $id)
    {
        try {
            $existingRequest = DB::table('schedule_modification_requests')
                ->where('id', $id)
                ->first();
            
            if (!$existingRequest) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Modification request not found'
                ]);
            }
            
            if ($existingRequest->status !== 'pending') {
                return response()->json([
                    'status' => 400,
                    'message' => 'Only pending requests can be deleted'
                ]);
            }
            
            DB::table('schedule_modification_requests')
                ->where('id', $id)
                ->delete();
            
            return response()->json([
                'status' => 200,
                'message' => 'Modification request deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting modification request: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete modification request',
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get a single modification request
     */
    public function getModificationRequest(string $id)
    {
        try {
            $req = DB::table('schedule_modification_requests')
                ->leftJoin('doctor_schedules', 'schedule_modification_requests.schedule_id', '=', 'doctor_schedules.id')
                ->leftJoin('branches', 'schedule_modification_requests.branch_id', '=', 'branches.id')
                ->where('schedule_modification_requests.id', $id)
                ->select([
                    'schedule_modification_requests.*',
                    'doctor_schedules.schedule_day',
                    'doctor_schedules.start_time as schedule_start_time',
                    'doctor_schedules.end_time as schedule_end_time',
                    'branches.center_name as branch_name'
                ])
                ->first();
            
            if (!$req) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Modification request not found'
                ]);
            }
            
            return response()->json([
                'status' => 200,
                'request' => $req
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching modification request: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch modification request',
                'error' => $e->getMessage()
            ]);
        }
    }
}
