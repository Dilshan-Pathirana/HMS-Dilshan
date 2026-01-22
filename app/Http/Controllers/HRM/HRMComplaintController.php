<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * STEP 18: HR Complaints/Grievances Controller
 * Employee grievance submission and tracking system
 */
class HRMComplaintController extends Controller
{
    private function validateToken(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        $accessToken = PersonalAccessToken::findToken($token);
        return $accessToken ? $accessToken->tokenable : null;
    }

    private function isSuperAdmin($user): bool
    {
        return $user && in_array($user->role, ['super_admin', 'admin']);
    }

    private function isBranchAdmin($user): bool
    {
        return $user && in_array($user->role, ['branch_admin', 'manager']);
    }

    private function isHRStaff($user): bool
    {
        return $user && in_array($user->role, ['hr_manager', 'hr_staff', 'super_admin', 'admin']);
    }

    /**
     * Submit a complaint (Employee)
     */
    public function submitComplaint(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'complaint_type' => 'required|in:harassment,discrimination,workplace_safety,policy_violation,salary_dispute,leave_dispute,workload,bullying,misconduct,facilities,other',
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'expected_resolution' => 'nullable|string',
            'incident_date' => 'nullable|date|before_or_equal:today',
            'incident_location' => 'nullable|string|max:255',
            'witnesses' => 'nullable|array',
            'priority' => 'nullable|in:low,medium,high,critical',
            'is_anonymous' => 'nullable|boolean'
        ]);

        // Generate ticket number
        $ticketNumber = 'GRV-' . date('Ymd') . '-' . strtoupper(Str::random(4));

        $complaintId = Str::uuid()->toString();

        DB::table('hr_complaints')->insert([
            'id' => $complaintId,
            'ticket_number' => $ticketNumber,
            'complainant_id' => $user->id,
            'against_id' => $request->input('against_id'),
            'complaint_type' => $request->complaint_type,
            'subject' => $request->subject,
            'description' => $request->description,
            'expected_resolution' => $request->expected_resolution,
            'incident_date' => $request->incident_date,
            'incident_location' => $request->incident_location,
            'witnesses' => $request->witnesses ? json_encode($request->witnesses) : null,
            'attachments' => $request->attachments ? json_encode($request->attachments) : null,
            'priority' => $request->priority ?? 'medium',
            'status' => 'submitted',
            'is_anonymous' => $request->input('is_anonymous', false),
            'is_confidential' => true,
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Add initial update
        DB::table('hr_complaint_updates')->insert([
            'id' => Str::uuid()->toString(),
            'complaint_id' => $complaintId,
            'user_id' => $user->id,
            'comment' => 'Complaint submitted',
            'is_internal' => false,
            'update_type' => 'status_change',
            'new_status' => 'submitted',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Complaint submitted successfully',
            'data' => [
                'id' => $complaintId,
                'ticket_number' => $ticketNumber
            ]
        ], 201);
    }

    /**
     * Get my complaints (Employee)
     */
    public function getMyComplaints(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $complaints = DB::table('hr_complaints')
            ->where('complainant_id', $user->id)
            ->whereNull('deleted_at')
            ->select(
                'id',
                'ticket_number',
                'complaint_type',
                'subject',
                'priority',
                'status',
                'created_at',
                'resolution_date',
                'satisfaction_rating'
            )
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $complaints
        ]);
    }

    /**
     * Get complaint details
     */
    public function getComplaintDetails(Request $request, $complaintId)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $complaint = DB::table('hr_complaints')
            ->where('id', $complaintId)
            ->whereNull('deleted_at')
            ->first();

        if (!$complaint) {
            return response()->json(['status' => 'error', 'message' => 'Complaint not found'], 404);
        }

        // Check access
        $isOwner = $user->id === $complaint->complainant_id;
        $isHR = $this->isHRStaff($user) || $this->isSuperAdmin($user);
        $isAssigned = $user->id === $complaint->assigned_to;

        if (!$isOwner && !$isHR && !$isAssigned) {
            return response()->json(['status' => 'error', 'message' => 'Access denied'], 403);
        }

        // Get updates (filter internal notes for non-HR)
        $updatesQuery = DB::table('hr_complaint_updates as cu')
            ->join('users as u', 'cu.user_id', '=', 'u.id')
            ->where('cu.complaint_id', $complaintId)
            ->select(
                'cu.id',
                'cu.comment',
                'cu.update_type',
                'cu.old_status',
                'cu.new_status',
                'cu.created_at',
                DB::raw("CASE WHEN cu.is_internal = 1 THEN 'HR Staff' ELSE u.first_name || ' ' || u.last_name END as author")
            )
            ->orderBy('cu.created_at', 'asc');

        if (!$isHR) {
            $updatesQuery->where('cu.is_internal', false);
        }

        $updates = $updatesQuery->get();

        // Hide complainant identity if anonymous (for HR viewing)
        if ($complaint->is_anonymous && !$isOwner) {
            $complaint->complainant_id = null;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'complaint' => $complaint,
                'updates' => $updates
            ]
        ]);
    }

    /**
     * Get all complaints (HR Admin)
     */
    public function getAllComplaints(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isHRStaff($user) && !$this->isSuperAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $status = $request->input('status');
        $priority = $request->input('priority');
        $type = $request->input('type');

        $query = DB::table('hr_complaints as c')
            ->leftJoin('users as u', function($join) {
                $join->on('c.complainant_id', '=', 'u.id')
                    ->where('c.is_anonymous', '=', false);
            })
            ->whereNull('c.deleted_at')
            ->select(
                'c.id',
                'c.ticket_number',
                'c.complaint_type',
                'c.subject',
                'c.priority',
                'c.status',
                'c.is_anonymous',
                'c.assigned_to',
                'c.created_at',
                'c.incident_date',
                DB::raw("CASE WHEN c.is_anonymous = 1 THEN 'Anonymous' ELSE u.first_name || ' ' || u.last_name END as complainant_name")
            );

        if ($status) {
            $query->where('c.status', $status);
        }
        if ($priority) {
            $query->where('c.priority', $priority);
        }
        if ($type) {
            $query->where('c.complaint_type', $type);
        }

        $complaints = $query->orderByRaw("CASE c.priority 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 END")
            ->orderBy('c.created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $complaints
        ]);
    }

    /**
     * Update complaint status (HR Admin)
     */
    public function updateStatus(Request $request, $complaintId)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isHRStaff($user) && !$this->isSuperAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'status' => 'required|in:submitted,under_review,investigation,pending_response,resolved,closed,escalated,withdrawn',
            'comment' => 'nullable|string'
        ]);

        $complaint = DB::table('hr_complaints')
            ->where('id', $complaintId)
            ->whereNull('deleted_at')
            ->first();

        if (!$complaint) {
            return response()->json(['status' => 'error', 'message' => 'Complaint not found'], 404);
        }

        $oldStatus = $complaint->status;

        DB::beginTransaction();
        try {
            // Update complaint
            $updateData = [
                'status' => $request->status,
                'updated_at' => now()
            ];

            if ($request->status === 'resolved' || $request->status === 'closed') {
                $updateData['resolution_date'] = date('Y-m-d');
                if ($request->has('resolution_outcome')) {
                    $updateData['resolution_outcome'] = $request->resolution_outcome;
                }
                if ($request->has('resolution_summary')) {
                    $updateData['resolution_summary'] = $request->resolution_summary;
                }
            }

            DB::table('hr_complaints')
                ->where('id', $complaintId)
                ->update($updateData);

            // Add update record
            DB::table('hr_complaint_updates')->insert([
                'id' => Str::uuid()->toString(),
                'complaint_id' => $complaintId,
                'user_id' => $user->id,
                'comment' => $request->input('comment', 'Status updated'),
                'is_internal' => $request->input('is_internal', false),
                'update_type' => 'status_change',
                'old_status' => $oldStatus,
                'new_status' => $request->status,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Complaint status updated'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Failed to update status'], 500);
        }
    }

    /**
     * Assign complaint to HR staff
     */
    public function assignComplaint(Request $request, $complaintId)
    {
        $user = $this->validateToken($request);
        if (!$user || !$this->isSuperAdmin($user)) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'assigned_to' => 'required|uuid|exists:users,id'
        ]);

        $complaint = DB::table('hr_complaints')
            ->where('id', $complaintId)
            ->whereNull('deleted_at')
            ->first();

        if (!$complaint) {
            return response()->json(['status' => 'error', 'message' => 'Complaint not found'], 404);
        }

        DB::table('hr_complaints')
            ->where('id', $complaintId)
            ->update([
                'assigned_to' => $request->assigned_to,
                'assigned_at' => now(),
                'status' => 'under_review',
                'updated_at' => now()
            ]);

        // Add assignment update
        $assignee = DB::table('users')->where('id', $request->assigned_to)->first();
        DB::table('hr_complaint_updates')->insert([
            'id' => Str::uuid()->toString(),
            'complaint_id' => $complaintId,
            'user_id' => $user->id,
            'comment' => 'Complaint assigned to ' . ($assignee ? $assignee->first_name . ' ' . $assignee->last_name : 'HR Staff'),
            'is_internal' => true,
            'update_type' => 'assignment',
            'old_status' => $complaint->status,
            'new_status' => 'under_review',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Complaint assigned successfully'
        ]);
    }

    /**
     * Add comment to complaint
     */
    public function addComment(Request $request, $complaintId)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'comment' => 'required|string',
            'is_internal' => 'nullable|boolean'
        ]);

        $complaint = DB::table('hr_complaints')
            ->where('id', $complaintId)
            ->whereNull('deleted_at')
            ->first();

        if (!$complaint) {
            return response()->json(['status' => 'error', 'message' => 'Complaint not found'], 404);
        }

        // Check access
        $isOwner = $user->id === $complaint->complainant_id;
        $isHR = $this->isHRStaff($user) || $this->isSuperAdmin($user);
        $isAssigned = $user->id === $complaint->assigned_to;

        if (!$isOwner && !$isHR && !$isAssigned) {
            return response()->json(['status' => 'error', 'message' => 'Access denied'], 403);
        }

        // Only HR can add internal comments
        $isInternal = $isHR ? ($request->input('is_internal', false)) : false;

        DB::table('hr_complaint_updates')->insert([
            'id' => Str::uuid()->toString(),
            'complaint_id' => $complaintId,
            'user_id' => $user->id,
            'comment' => $request->comment,
            'is_internal' => $isInternal,
            'update_type' => 'comment',
            'attachments' => $request->attachments ? json_encode($request->attachments) : null,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Comment added'
        ]);
    }

    /**
     * Submit satisfaction rating (after resolution)
     */
    public function submitRating(Request $request, $complaintId)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'feedback' => 'nullable|string'
        ]);

        $complaint = DB::table('hr_complaints')
            ->where('id', $complaintId)
            ->where('complainant_id', $user->id)
            ->whereIn('status', ['resolved', 'closed'])
            ->whereNull('satisfaction_rating')
            ->first();

        if (!$complaint) {
            return response()->json(['status' => 'error', 'message' => 'Complaint not found or already rated'], 404);
        }

        DB::table('hr_complaints')
            ->where('id', $complaintId)
            ->update([
                'satisfaction_rating' => $request->rating,
                'feedback' => $request->feedback,
                'updated_at' => now()
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Thank you for your feedback'
        ]);
    }

    /**
     * Withdraw complaint (Employee)
     */
    public function withdrawComplaint(Request $request, $complaintId)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $complaint = DB::table('hr_complaints')
            ->where('id', $complaintId)
            ->where('complainant_id', $user->id)
            ->whereIn('status', ['submitted', 'under_review'])
            ->whereNull('deleted_at')
            ->first();

        if (!$complaint) {
            return response()->json(['status' => 'error', 'message' => 'Complaint not found or cannot be withdrawn'], 404);
        }

        DB::table('hr_complaints')
            ->where('id', $complaintId)
            ->update([
                'status' => 'withdrawn',
                'resolution_outcome' => 'withdrawn',
                'updated_at' => now()
            ]);

        DB::table('hr_complaint_updates')->insert([
            'id' => Str::uuid()->toString(),
            'complaint_id' => $complaintId,
            'user_id' => $user->id,
            'comment' => 'Complaint withdrawn by employee',
            'is_internal' => false,
            'update_type' => 'status_change',
            'old_status' => $complaint->status,
            'new_status' => 'withdrawn',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Complaint withdrawn'
        ]);
    }

    /**
     * Get complaint statistics
     */
    public function getComplaintStats(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isHRStaff($user) && !$this->isSuperAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $stats = [
            'total' => DB::table('hr_complaints')->whereNull('deleted_at')->count(),
            'pending' => DB::table('hr_complaints')
                ->whereIn('status', ['submitted', 'under_review', 'investigation', 'pending_response'])
                ->whereNull('deleted_at')
                ->count(),
            'resolved' => DB::table('hr_complaints')
                ->whereIn('status', ['resolved', 'closed'])
                ->whereNull('deleted_at')
                ->count(),
            'by_type' => DB::table('hr_complaints')
                ->whereNull('deleted_at')
                ->select('complaint_type', DB::raw('count(*) as count'))
                ->groupBy('complaint_type')
                ->get(),
            'by_priority' => DB::table('hr_complaints')
                ->whereIn('status', ['submitted', 'under_review', 'investigation', 'pending_response'])
                ->whereNull('deleted_at')
                ->select('priority', DB::raw('count(*) as count'))
                ->groupBy('priority')
                ->get(),
            'avg_resolution_days' => DB::table('hr_complaints')
                ->whereIn('status', ['resolved', 'closed'])
                ->whereNotNull('resolution_date')
                ->whereNull('deleted_at')
                ->selectRaw('AVG(julianday(resolution_date) - julianday(date(created_at))) as avg_days')
                ->value('avg_days'),
            'avg_satisfaction' => DB::table('hr_complaints')
                ->whereNotNull('satisfaction_rating')
                ->whereNull('deleted_at')
                ->avg('satisfaction_rating')
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }
}
