<?php

namespace App\Http\Controllers\BranchAdmin;

use App\Http\Controllers\Controller;
use App\Services\POSAuditService;
use App\Traits\EnforcesBranchIsolation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BranchAdminRequestsController extends Controller
{
    use EnforcesBranchIsolation;
    /**
     * Get request statistics for the branch admin dashboard
     */
    public function getRequestStats(Request $request)
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;
            $today = now()->toDateString();

            // Get pending EOD reports count (from daily_cash_summaries table)
            $pendingEODReports = DB::table('daily_cash_summaries')
                ->where('branch_id', $branchId)
                ->where('eod_status', 'SUBMITTED')
                ->count();

            // Get pending cash entries count
            $pendingCashEntries = DB::table('cash_entries')
                ->join('users', 'cash_entries.cashier_id', '=', 'users.id')
                ->where('users.branch_id', $branchId)
                ->where('cash_entries.approval_status', 'PENDING')
                ->count();

            // Get pending purchase requests count
            $pendingPurchaseRequests = DB::table('purchase_requests')
                ->where('branch_id', $branchId)
                ->where('status', 'pending')
                ->count();

            // Get pending doctor schedule requests count (using LIKE for cross-database compatibility)
            $pendingScheduleRequests = DB::table('approval_requests')
                ->where('entity_type', 'doctor_schedule')
                ->where('status', 'pending')
                ->where('request_data', 'LIKE', '%"branch_id":"' . $branchId . '"%')
                ->count();

            // Get pending schedule modification requests count
            $pendingModificationRequests = DB::table('schedule_modification_requests')
                ->where('branch_id', $branchId)
                ->where('status', 'pending')
                ->count();

            // Get today's total submissions (EOD reports submitted today)
            $todaySubmissions = DB::table('daily_cash_summaries')
                ->where('branch_id', $branchId)
                ->whereDate('submitted_at', $today)
                ->count();

            // Calculate total pending requests for badge notification
            $totalPendingRequests = $pendingEODReports + $pendingCashEntries + $pendingPurchaseRequests + $pendingScheduleRequests + $pendingModificationRequests;

            return response()->json([
                'success' => true,
                'data' => [
                    'pending_eod_reports' => $pendingEODReports,
                    'pending_cash_entries' => $pendingCashEntries,
                    'pending_purchase_requests' => $pendingPurchaseRequests,
                    'pending_schedule_requests' => $pendingScheduleRequests,
                    'pending_modification_requests' => $pendingModificationRequests,
                    'total_pending_requests' => $totalPendingRequests,
                    'today_submissions' => $todaySubmissions
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching request stats: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [
                    'pending_eod_reports' => 0,
                    'pending_cash_entries' => 0,
                    'pending_purchase_requests' => 0,
                    'pending_schedule_requests' => 0,
                    'pending_modification_requests' => 0,
                    'total_pending_requests' => 0,
                    'today_submissions' => 0
                ]
            ]);
        }
    }

    /**
     * Get EOD reports for branch admin review
     */
    public function getEODReports(Request $request)
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;
            
            $dateFrom = $request->input('date_from', now()->toDateString());
            $dateTo = $request->input('date_to', now()->toDateString());
            $status = $request->input('status', 'all');

            $query = DB::table('daily_cash_summaries')
                ->join('users', 'daily_cash_summaries.cashier_id', '=', 'users.id')
                ->where('daily_cash_summaries.branch_id', $branchId)
                ->whereDate('daily_cash_summaries.summary_date', '>=', $dateFrom)
                ->whereDate('daily_cash_summaries.summary_date', '<=', $dateTo)
                ->select([
                    'daily_cash_summaries.id',
                    'daily_cash_summaries.cashier_id',
                    DB::raw("CONCAT(users.first_name, ' ', users.last_name) as cashier_name"),
                    'daily_cash_summaries.summary_date as report_date',
                    'daily_cash_summaries.total_sales',
                    'daily_cash_summaries.total_transactions',
                    'daily_cash_summaries.cash_total',
                    'daily_cash_summaries.card_total',
                    'daily_cash_summaries.online_total',
                    'daily_cash_summaries.qr_total',
                    'daily_cash_summaries.cash_in_total',
                    'daily_cash_summaries.cash_out_total',
                    'daily_cash_summaries.expected_cash_balance as expected_balance',
                    'daily_cash_summaries.actual_cash_counted as actual_balance',
                    'daily_cash_summaries.cash_variance as variance',
                    'daily_cash_summaries.eod_status as status',
                    'daily_cash_summaries.submitted_at',
                    'daily_cash_summaries.variance_remarks as notes'
                ]);

            if ($status !== 'all') {
                $query->where('daily_cash_summaries.eod_status', $status);
            }

            $reports = $query->orderBy('daily_cash_summaries.summary_date', 'desc')->get();

            // Calculate stats - use Carbon to parse dates for comparison
            $today = now()->toDateString();
            $stats = [
                'total_reports' => $reports->count(),
                'pending_review' => $reports->where('status', 'SUBMITTED')->count(),
                'approved_today' => $reports->where('status', 'APPROVED')
                    ->filter(fn($r) => \Carbon\Carbon::parse($r->report_date)->toDateString() === $today)->count(),
                'total_sales_today' => $reports->filter(fn($r) => \Carbon\Carbon::parse($r->report_date)->toDateString() === $today)->sum('total_sales')
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'reports' => $reports,
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching EOD reports: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [
                    'reports' => [],
                    'stats' => [
                        'total_reports' => 0,
                        'pending_review' => 0,
                        'approved_today' => 0,
                        'total_sales_today' => 0
                    ]
                ]
            ]);
        }
    }

    /**
     * Approve an EOD report
     */
    public function approveEODReport(Request $request, $id)
    {
        try {
            $report = DB::table('daily_cash_summaries')->where('id', $id)->first();
            $beforeStatus = $report ? $report->eod_status : null;

            DB::table('daily_cash_summaries')
                ->where('id', $id)
                ->update([
                    'eod_status' => 'APPROVED',
                    'approved_by' => $request->user()->id,
                    'approved_at' => now(),
                    'updated_at' => now()
                ]);

            // Audit log: EOD approved
            POSAuditService::logEODReview(
                $id,
                POSAuditService::ACTION_EOD_APPROVE,
                ['status' => $beforeStatus],
                ['status' => 'APPROVED', 'approved_by' => $request->user()->id],
                null,
                $report->branch_id ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'EOD report approved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error approving EOD report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve EOD report'
            ], 500);
        }
    }

    /**
     * Reject an EOD report
     */
    public function rejectEODReport(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'reason' => 'nullable|string|max:500'
            ]);

            $report = DB::table('daily_cash_summaries')->where('id', $id)->first();
            $beforeStatus = $report ? $report->eod_status : null;

            DB::table('daily_cash_summaries')
                ->where('id', $id)
                ->update([
                    'eod_status' => 'REJECTED',
                    'variance_remarks' => $validated['reason'] ?? null,
                    'updated_at' => now()
                ]);

            // Audit log: EOD rejected
            POSAuditService::logEODReview(
                $id,
                POSAuditService::ACTION_EOD_REJECT,
                ['status' => $beforeStatus],
                ['status' => 'REJECTED'],
                $validated['reason'] ?? null,
                $report->branch_id ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'EOD report rejected'
            ]);
        } catch (\Exception $e) {
            Log::error('Error rejecting EOD report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject EOD report'
            ], 500);
        }
    }

    /**
     * Flag an EOD report for discrepancy investigation
     * This marks the report as FLAGGED and requires follow-up
     */
    public function flagEODDiscrepancy(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:1000',
                'severity' => 'nullable|string|in:low,medium,high'
            ]);

            // Verify the report belongs to the admin's branch
            $report = DB::table('daily_cash_summaries')
                ->where('id', $id)
                ->first();

            if (!$report) {
                return response()->json([
                    'success' => false,
                    'message' => 'EOD report not found'
                ], 404);
            }

            if ($report->branch_id !== $request->user()->branch_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to flag this report'
                ], 403);
            }

            $beforeStatus = $report->eod_status;

            // Build the flag note with severity and reason
            $severity = $validated['severity'] ?? 'medium';
            $flagNote = "[FLAGGED - " . strtoupper($severity) . " SEVERITY] " . $validated['reason'];
            
            // Append to existing remarks if any
            $existingRemarks = $report->variance_remarks ?? '';
            $newRemarks = $existingRemarks ? $existingRemarks . "\n\n" . $flagNote : $flagNote;

            DB::table('daily_cash_summaries')
                ->where('id', $id)
                ->update([
                    'eod_status' => 'FLAGGED',
                    'variance_remarks' => $newRemarks,
                    'updated_at' => now()
                ]);

            // Audit log: EOD flagged
            POSAuditService::logEODReview(
                $id,
                POSAuditService::ACTION_EOD_FLAG,
                ['status' => $beforeStatus],
                ['status' => 'FLAGGED', 'severity' => $severity],
                $validated['reason'],
                $report->branch_id
            );

            Log::info('EOD report flagged for discrepancy', [
                'eod_id' => $id,
                'flagged_by' => $request->user()->id,
                'severity' => $severity,
                'reason' => $validated['reason']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'EOD report flagged for discrepancy investigation'
            ]);
        } catch (\Exception $e) {
            Log::error('Error flagging EOD report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to flag EOD report'
            ], 500);
        }
    }

    /**
     * Reset an EOD report back to OPEN status
     * This allows the cashier to make corrections and resubmit
     */
    public function resetEODReport(Request $request, $id)
    {
        try {
            // Get the report first to verify it belongs to the branch
            $report = DB::table('daily_cash_summaries')
                ->where('id', $id)
                ->first();

            if (!$report) {
                return response()->json([
                    'success' => false,
                    'message' => 'EOD report not found'
                ], 404);
            }

            // Verify the report belongs to the admin's branch
            if ($report->branch_id !== $request->user()->branch_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to reset this report'
                ], 403);
            }

            // Reset the EOD report to OPEN
            DB::table('daily_cash_summaries')
                ->where('id', $id)
                ->update([
                    'eod_status' => 'OPEN',
                    'submitted_at' => null,
                    'approved_by' => null,
                    'approved_at' => null,
                    'actual_cash_counted' => 0,
                    'cash_variance' => 0,
                    'variance_remarks' => null,
                    'updated_at' => now()
                ]);

            // Unlock transactions and cash entries for this EOD
            DB::table('billing_transactions')
                ->where('eod_summary_id', $id)
                ->update(['is_locked' => false, 'eod_summary_id' => null]);

            DB::table('cash_entries')
                ->where('eod_summary_id', $id)
                ->update(['is_locked' => false, 'eod_summary_id' => null]);

            Log::info('EOD report reset to OPEN', [
                'report_id' => $id,
                'reset_by' => $request->user()->id,
                'branch_id' => $report->branch_id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'EOD report reset to OPEN. Cashier can now make corrections and resubmit.'
            ]);
        } catch (\Exception $e) {
            Log::error('Error resetting EOD report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset EOD report'
            ], 500);
        }
    }

    /**
     * Get cash entries for branch admin review
     */
    public function getCashEntries(Request $request)
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;
            
            $dateFrom = $request->input('date_from', now()->toDateString());
            $dateTo = $request->input('date_to', now()->toDateString());
            $type = $request->input('type', 'all');
            $status = $request->input('status', 'all');

            $query = DB::table('cash_entries')
                ->join('users', 'cash_entries.cashier_id', '=', 'users.id')
                ->where('users.branch_id', $branchId)
                ->whereBetween(DB::raw('DATE(cash_entries.entry_date)'), [$dateFrom, $dateTo])
                ->select([
                    'cash_entries.id',
                    'cash_entries.cashier_id',
                    DB::raw("CONCAT(users.first_name, ' ', users.last_name) as cashier_name"),
                    'cash_entries.entry_type',
                    'cash_entries.category',
                    'cash_entries.amount',
                    'cash_entries.description',
                    'cash_entries.reference_number',
                    'cash_entries.remarks',
                    'cash_entries.approval_status',
                    'cash_entries.entry_date',
                    'cash_entries.created_at',
                    'cash_entries.approved_by',
                    'cash_entries.approved_at'
                ]);

            if ($type !== 'all') {
                $query->where('cash_entries.entry_type', $type);
            }

            if ($status !== 'all') {
                $query->where('cash_entries.approval_status', $status);
            }

            $entries = $query->orderBy('cash_entries.entry_date', 'desc')
                ->orderBy('cash_entries.created_at', 'desc')
                ->get();

            // Calculate stats
            $cashInTotal = $entries->where('entry_type', 'CASH_IN')->sum('amount');
            $cashOutTotal = $entries->where('entry_type', 'CASH_OUT')->sum('amount');

            $stats = [
                'total_entries' => $entries->count(),
                'pending_approval' => $entries->where('approval_status', 'PENDING')->count(),
                'cash_in_total' => $cashInTotal,
                'cash_out_total' => $cashOutTotal,
                'net_amount' => $cashInTotal - $cashOutTotal
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'entries' => $entries,
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching cash entries: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [
                    'entries' => [],
                    'stats' => [
                        'total_entries' => 0,
                        'pending_approval' => 0,
                        'cash_in_total' => 0,
                        'cash_out_total' => 0,
                        'net_amount' => 0
                    ]
                ]
            ]);
        }
    }

    /**
     * Approve a cash entry
     */
    public function approveCashEntry(Request $request, $id)
    {
        try {
            DB::table('cash_entries')
                ->where('id', $id)
                ->update([
                    'approval_status' => 'APPROVED',
                    'approved_by' => $request->user()->id,
                    'approved_at' => now(),
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Cash entry approved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error approving cash entry: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve cash entry'
            ], 500);
        }
    }

    /**
     * Reject a cash entry
     */
    public function rejectCashEntry(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'reason' => 'nullable|string|max:500'
            ]);

            DB::table('cash_entries')
                ->where('id', $id)
                ->update([
                    'approval_status' => 'REJECTED',
                    'approved_by' => $request->user()->id,
                    'approved_at' => now(),
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Cash entry rejected'
            ]);
        } catch (\Exception $e) {
            Log::error('Error rejecting cash entry: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject cash entry'
            ], 500);
        }
    }

    /**
     * Get pending doctor schedule requests for branch admin review
     */
    public function getScheduleRequests(Request $request)
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;
            
            $getPendingRequests = new \App\Action\DoctorSchedule\GetPendingScheduleRequests();
            $result = $getPendingRequests($branchId);
            
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Error fetching schedule requests: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch schedule requests',
                'requests' => []
            ]);
        }
    }

    /**
     * Approve a doctor schedule request
     */
    public function approveScheduleRequest(Request $request, $id)
    {
        try {
            $user = $request->user();
            $notes = $request->input('notes', null);
            
            $approveRequest = new \App\Action\DoctorSchedule\ApproveDoctorScheduleRequest();
            $result = $approveRequest($id, $user->id, 'approve', $notes);
            
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Error approving schedule request: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to approve schedule request'
            ]);
        }
    }

    /**
     * Reject a doctor schedule request
     */
    public function rejectScheduleRequest(Request $request, $id)
    {
        try {
            $user = $request->user();
            $notes = $request->input('notes', $request->input('reason', null));
            
            $approveRequest = new \App\Action\DoctorSchedule\ApproveDoctorScheduleRequest();
            $result = $approveRequest($id, $user->id, 'reject', $notes);
            
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Error rejecting schedule request: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to reject schedule request'
            ]);
        }
    }

    /**
     * Request revision for a doctor schedule request
     */
    public function requestRevisionScheduleRequest(Request $request, $id)
    {
        try {
            $user = $request->user();
            $notes = $request->input('notes', $request->input('reason', null));
            
            $approveRequest = new \App\Action\DoctorSchedule\ApproveDoctorScheduleRequest();
            $result = $approveRequest($id, $user->id, 'revision_requested', $notes);
            
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Error requesting revision: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to request revision'
            ]);
        }
    }

    /**
     * Get approved doctor schedules for the branch
     */
    public function getApprovedDoctorSchedules(Request $request)
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;

            // Get all approved doctor schedules for this branch
            $schedules = DB::table('doctor_schedules')
                ->join('users', 'doctor_schedules.doctor_id', '=', 'users.id')
                ->leftJoin('branches', 'doctor_schedules.branch_id', '=', 'branches.id')
                ->where('doctor_schedules.branch_id', $branchId)
                ->select([
                    'doctor_schedules.id',
                    'doctor_schedules.doctor_id',
                    'doctor_schedules.branch_id',
                    'doctor_schedules.schedule_day',
                    'doctor_schedules.start_time',
                    'doctor_schedules.end_time',
                    'doctor_schedules.max_patients',
                    'doctor_schedules.time_per_patient',
                    'doctor_schedules.created_at',
                    'users.first_name as doctor_first_name',
                    'users.last_name as doctor_last_name',
                    'users.email as doctor_email',
                    'branches.center_name as branch_name'
                ])
                ->orderBy('doctor_schedules.schedule_day')
                ->orderBy('doctor_schedules.start_time')
                ->get();

            // Transform the data
            $formattedSchedules = $schedules->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'doctor_id' => $schedule->doctor_id,
                    'doctor_name' => trim(($schedule->doctor_first_name ?? '') . ' ' . ($schedule->doctor_last_name ?? '')),
                    'doctor_email' => $schedule->doctor_email,
                    'doctor_specialization' => null, // Not available in users table
                    'branch_id' => $schedule->branch_id,
                    'branch_name' => $schedule->branch_name,
                    'schedule_day' => $schedule->schedule_day,
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'max_patients' => $schedule->max_patients,
                    'time_per_patient' => $schedule->time_per_patient,
                    'created_at' => $schedule->created_at,
                ];
            });

            // Group schedules by day for easier display
            $groupedByDay = $formattedSchedules->groupBy('schedule_day');

            return response()->json([
                'status' => 200,
                'schedules' => $formattedSchedules,
                'grouped_by_day' => $groupedByDay,
                'total' => $formattedSchedules->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching approved doctor schedules: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch doctor schedules',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get schedule modification requests for branch admin
     * Includes both doctor modification requests and employee schedule change requests
     */
    public function getModificationRequests(Request $request)
    {
        try {
            $user = $request->user();
            $branchId = $user->branch_id;
            $status = $request->query('status', 'all');
            
            // Get doctor modification requests
            $doctorQuery = DB::table('schedule_modification_requests')
                ->join('users as doctor', 'schedule_modification_requests.doctor_id', '=', 'doctor.id')
                ->leftJoin('doctor_schedules', 'schedule_modification_requests.schedule_id', '=', 'doctor_schedules.id')
                ->leftJoin('branches', 'schedule_modification_requests.branch_id', '=', 'branches.id')
                ->leftJoin('schedule_modification_requests as parent_req', 'schedule_modification_requests.parent_request_id', '=', 'parent_req.id')
                ->where('schedule_modification_requests.branch_id', $branchId)
                ->select([
                    'schedule_modification_requests.*',
                    'doctor.first_name as doctor_first_name',
                    'doctor.last_name as doctor_last_name',
                    'doctor.email as doctor_email',
                    'doctor_schedules.schedule_day',
                    'doctor_schedules.start_time as schedule_start_time',
                    'doctor_schedules.end_time as schedule_end_time',
                    'branches.center_name as branch_name',
                    'parent_req.request_type as parent_request_type',
                    'parent_req.start_date as parent_start_date',
                    'parent_req.end_date as parent_end_date'
                ])
                ->orderBy('schedule_modification_requests.created_at', 'desc');
            
            if ($status !== 'all') {
                $doctorQuery->where('schedule_modification_requests.status', $status);
            }
            
            $doctorRequests = $doctorQuery->get();
            
            // Transform doctor requests
            $formattedDoctorRequests = $doctorRequests->map(function ($req) {
                return [
                    'id' => $req->id,
                    'source' => 'doctor', // Indicate this is a doctor request
                    'user_id' => $req->doctor_id,
                    'user_name' => trim(($req->doctor_first_name ?? '') . ' ' . ($req->doctor_last_name ?? '')),
                    'user_email' => $req->doctor_email,
                    'user_role' => 'Doctor',
                    'branch_id' => $req->branch_id,
                    'branch_name' => $req->branch_name,
                    'schedule_id' => $req->schedule_id,
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
                    'approval_notes' => $req->approval_notes,
                    'approved_at' => $req->approved_at,
                    'created_at' => $req->created_at,
                    'parent_request_id' => $req->parent_request_id,
                    'parent_request_type' => $req->parent_request_type,
                    'parent_start_date' => $req->parent_start_date,
                    // Legacy fields for backwards compatibility
                    'doctor_id' => $req->doctor_id,
                    'doctor_name' => trim(($req->doctor_first_name ?? '') . ' ' . ($req->doctor_last_name ?? '')),
                    'doctor_email' => $req->doctor_email,
                ];
            });
            
            // Get employee schedule change requests
            $driver = DB::connection()->getDriverName();
            if ($driver === 'sqlite') {
                $employeeNameConcat = "u.first_name || ' ' || u.last_name";
                $interchangeNameConcat = "iw.first_name || ' ' || iw.last_name";
            } else {
                $employeeNameConcat = "CONCAT(u.first_name, ' ', u.last_name)";
                $interchangeNameConcat = "CONCAT(iw.first_name, ' ', iw.last_name)";
            }
            
            $employeeQuery = DB::table('schedule_change_requests as scr')
                ->join('users as u', 'scr.user_id', '=', 'u.id')
                ->leftJoin('users as iw', 'scr.interchange_with', '=', 'iw.id')
                ->leftJoin('branches as b', 'scr.branch_id', '=', 'b.id')
                ->where('scr.branch_id', $branchId)
                // For interchange requests, only show those that have been peer-approved
                // For other request types, show all pending requests
                ->where(function($query) {
                    $query->where(function($q) {
                        // Non-interchange requests
                        $q->where('scr.request_type', '!=', 'interchange');
                    })->orWhere(function($q) {
                        // Interchange requests that have been peer-approved
                        $q->where('scr.request_type', 'interchange')
                          ->where('scr.peer_status', 'approved');
                    });
                })
                ->select([
                    'scr.*',
                    DB::raw("$employeeNameConcat as employee_name"),
                    'u.email as employee_email',
                    'u.role_as as employee_role',
                    DB::raw("$interchangeNameConcat as interchange_with_name"),
                    'b.center_name as branch_name'
                ])
                ->orderBy('scr.created_at', 'desc');
            
            if ($status !== 'all') {
                $employeeQuery->where('scr.status', $status);
            }
            
            $employeeRequests = $employeeQuery->get();
            
            // Map employee role numbers to role names
            $roleNames = [
                1 => 'Super Admin',
                2 => 'Branch Admin',
                3 => 'Doctor',
                4 => 'Nurse',
                5 => 'Patient',
                6 => 'Cashier',
                7 => 'Pharmacist'
            ];
            
            // Transform employee requests
            $formattedEmployeeRequests = $employeeRequests->map(function ($req) use ($roleNames) {
                $roleName = $roleNames[$req->employee_role] ?? 'Staff';
                return [
                    'id' => $req->id,
                    'source' => 'employee', // Indicate this is an employee request
                    'user_id' => $req->user_id,
                    'user_name' => $req->employee_name,
                    'user_email' => $req->employee_email,
                    'user_role' => $roleName,
                    'branch_id' => $req->branch_id,
                    'branch_name' => $req->branch_name,
                    'schedule_id' => null,
                    'schedule_day' => null,
                    'schedule_start_time' => null,
                    'schedule_end_time' => null,
                    'request_type' => 'employee_' . $req->request_type, // Prefix with employee_
                    'start_date' => $req->original_shift_date,
                    'end_date' => $req->requested_shift_date,
                    'new_start_time' => null,
                    'new_end_time' => null,
                    'new_max_patients' => null,
                    'reason' => $req->reason,
                    'status' => $req->status,
                    'approval_notes' => $req->rejection_reason,
                    'approved_at' => $req->responded_at,
                    'created_at' => $req->created_at,
                    'parent_request_id' => null,
                    'parent_request_type' => null,
                    'parent_start_date' => null,
                    // Employee-specific fields
                    'original_shift_date' => $req->original_shift_date,
                    'original_shift_type' => $req->original_shift_type,
                    'requested_shift_date' => $req->requested_shift_date,
                    'requested_shift_type' => $req->requested_shift_type,
                    'interchange_with' => $req->interchange_with,
                    'interchange_with_name' => $req->interchange_with_name,
                    'interchange_shift_date' => $req->interchange_shift_date ?? null,
                    'interchange_shift_type' => $req->interchange_shift_type ?? null,
                    'peer_status' => $req->peer_status ?? null,
                    'peer_responded_at' => $req->peer_responded_at ?? null,
                    // Legacy fields for backwards compatibility
                    'doctor_id' => null,
                    'doctor_name' => null,
                    'doctor_email' => null,
                ];
            });
            
            // Merge and sort by created_at
            $allRequests = $formattedDoctorRequests->merge($formattedEmployeeRequests)
                ->sortByDesc('created_at')
                ->values();
            
            // Count by status (including both doctor and employee requests)
            $doctorPending = DB::table('schedule_modification_requests')
                ->where('branch_id', $branchId)
                ->where('status', 'pending')
                ->count();
            // Count only non-interchange requests OR interchange requests with peer_status = 'approved'
            $employeePending = DB::table('schedule_change_requests')
                ->where('branch_id', $branchId)
                ->where('status', 'pending')
                ->where(function($query) {
                    $query->where('request_type', '!=', 'interchange')
                          ->orWhere(function($q) {
                              $q->where('request_type', 'interchange')
                                ->where('peer_status', 'approved');
                          });
                })
                ->count();
            
            $doctorApproved = DB::table('schedule_modification_requests')
                ->where('branch_id', $branchId)
                ->where('status', 'approved')
                ->count();
            $employeeApproved = DB::table('schedule_change_requests')
                ->where('branch_id', $branchId)
                ->where('status', 'approved')
                ->count();
            
            $doctorRejected = DB::table('schedule_modification_requests')
                ->where('branch_id', $branchId)
                ->where('status', 'rejected')
                ->count();
            $employeeRejected = DB::table('schedule_change_requests')
                ->where('branch_id', $branchId)
                ->where('status', 'rejected')
                ->count();
            
            $counts = [
                'pending' => $doctorPending + $employeePending,
                'approved' => $doctorApproved + $employeeApproved,
                'rejected' => $doctorRejected + $employeeRejected,
                'cancellation_requests' => DB::table('schedule_modification_requests')
                    ->where('branch_id', $branchId)
                    ->where('request_type', 'cancel_block')
                    ->where('status', 'pending')
                    ->count(),
                'employee_requests' => $employeePending, // Count of pending employee requests
            ];
            
            return response()->json([
                'status' => 200,
                'requests' => $allRequests,
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
     * Approve a schedule modification request
     */
    public function approveModificationRequest(Request $request, string $id)
    {
        try {
            $user = $request->user();
            $notes = $request->input('notes', null);
            
            $modRequest = DB::table('schedule_modification_requests')
                ->where('id', $id)
                ->first();
            
            if (!$modRequest) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Modification request not found'
                ]);
            }
            
            if ($modRequest->status !== 'pending') {
                return response()->json([
                    'status' => 400,
                    'message' => 'This request has already been processed'
                ]);
            }
            
            // Update the request status
            DB::table('schedule_modification_requests')
                ->where('id', $id)
                ->update([
                    'status' => 'approved',
                    'approved_by' => $user->id,
                    'approval_notes' => $notes,
                    'approved_at' => now(),
                    'updated_at' => now(),
                ]);
            
            // Apply the modification based on type
            $this->applyScheduleModification($modRequest);
            
            return response()->json([
                'status' => 200,
                'message' => 'Modification request approved and applied successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error approving modification request: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to approve modification request',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Reject a schedule modification request
     */
    public function rejectModificationRequest(Request $request, string $id)
    {
        try {
            $user = $request->user();
            $notes = $request->input('notes', $request->input('reason', null));
            
            $modRequest = DB::table('schedule_modification_requests')
                ->where('id', $id)
                ->first();
            
            if (!$modRequest) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Modification request not found'
                ]);
            }
            
            if ($modRequest->status !== 'pending') {
                return response()->json([
                    'status' => 400,
                    'message' => 'This request has already been processed'
                ]);
            }
            
            DB::table('schedule_modification_requests')
                ->where('id', $id)
                ->update([
                    'status' => 'rejected',
                    'approved_by' => $user->id,
                    'approval_notes' => $notes,
                    'approved_at' => now(),
                    'updated_at' => now(),
                ]);
            
            // If this is a cancellation request that was rejected, restore parent's status
            if ($modRequest->request_type === 'cancel_block' && $modRequest->parent_request_id) {
                DB::table('schedule_modification_requests')
                    ->where('id', $modRequest->parent_request_id)
                    ->update([
                        'status' => 'approved',
                        'updated_at' => now()
                    ]);
            }
            
            return response()->json([
                'status' => 200,
                'message' => 'Modification request rejected'
            ]);
        } catch (\Exception $e) {
            Log::error('Error rejecting modification request: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to reject modification request',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Apply the schedule modification after approval
     */
    private function applyScheduleModification($modRequest)
    {
        try {
            switch ($modRequest->request_type) {
                case 'block_date':
                    // Insert a blocked date record or mark schedule as unavailable for the date
                    DB::table('doctor_schedule_cancels')->insert([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'doctor_id' => $modRequest->doctor_id,
                        'schedule_id' => $modRequest->schedule_id,
                        'branch_id' => $modRequest->branch_id,
                        'cancel_date' => $modRequest->start_date,
                        'reason' => $modRequest->reason,
                        'status' => 'approved',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    break;
                    
                case 'block_schedule':
                    // Disable the recurring schedule
                    if ($modRequest->schedule_id) {
                        DB::table('doctor_schedules')
                            ->where('id', $modRequest->schedule_id)
                            ->update([
                                'is_available' => 0,
                                'status' => 'blocked',
                                'updated_at' => now(),
                            ]);
                    }
                    break;
                    
                case 'cancel_block':
                    // Cancel a previously approved block date
                    // First, get the parent request
                    if ($modRequest->parent_request_id) {
                        $parentRequest = DB::table('schedule_modification_requests')
                            ->where('id', $modRequest->parent_request_id)
                            ->first();
                        
                        if ($parentRequest && $parentRequest->request_type === 'block_date') {
                            // Remove the blocked date from doctor_schedule_cancels
                            DB::table('doctor_schedule_cancels')
                                ->where('doctor_id', $parentRequest->doctor_id)
                                ->where('cancel_date', $parentRequest->start_date)
                                ->where('branch_id', $parentRequest->branch_id)
                                ->delete();
                            
                            // Update the parent request status to 'cancelled'
                            DB::table('schedule_modification_requests')
                                ->where('id', $modRequest->parent_request_id)
                                ->update([
                                    'status' => 'cancelled',
                                    'approval_notes' => 'Cancelled by doctor request',
                                    'updated_at' => now(),
                                ]);
                        } elseif ($parentRequest && $parentRequest->request_type === 'block_schedule') {
                            // Re-enable the schedule
                            if ($parentRequest->schedule_id) {
                                DB::table('doctor_schedules')
                                    ->where('id', $parentRequest->schedule_id)
                                    ->update([
                                        'is_available' => 1,
                                        'status' => 'active',
                                        'updated_at' => now(),
                                    ]);
                            }
                            
                            // Update the parent request status to 'cancelled'
                            DB::table('schedule_modification_requests')
                                ->where('id', $modRequest->parent_request_id)
                                ->update([
                                    'status' => 'cancelled',
                                    'approval_notes' => 'Cancelled by doctor request',
                                    'updated_at' => now(),
                                ]);
                        }
                    }
                    Log::info("Cancellation approved for doctor {$modRequest->doctor_id}, parent request: {$modRequest->parent_request_id}");
                    break;
                    
                case 'delay_start':
                case 'early_end':
                case 'limit_appointments':
                    // For these types, we'll store them in a schedule_overrides table
                    // or handle them when generating available slots
                    // For now, we'll just log them as approved
                    Log::info("Modification {$modRequest->request_type} approved for doctor {$modRequest->doctor_id}");
                    break;
            }
        } catch (\Exception $e) {
            Log::error('Error applying schedule modification: ' . $e->getMessage());
        }
    }

    /**
     * Approve an employee schedule change request
     */
    public function approveEmployeeScheduleRequest(Request $request, string $id)
    {
        try {
            $user = $request->user();
            $notes = $request->input('notes', null);
            
            $scheduleRequest = DB::table('schedule_change_requests')
                ->where('id', $id)
                ->first();
            
            if (!$scheduleRequest) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Schedule change request not found'
                ]);
            }
            
            if ($scheduleRequest->status !== 'pending') {
                return response()->json([
                    'status' => 400,
                    'message' => 'This request has already been processed'
                ]);
            }
            
            // Update the request status
            DB::table('schedule_change_requests')
                ->where('id', $id)
                ->update([
                    'status' => 'approved',
                    'responded_by' => $user->id,
                    'responded_at' => now(),
                    'updated_at' => now(),
                ]);
            
            // Apply the schedule change based on request type
            $this->applyEmployeeScheduleChange($scheduleRequest);
            
            return response()->json([
                'status' => 200,
                'message' => 'Employee schedule change request approved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error approving employee schedule request: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to approve employee schedule request',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Reject an employee schedule change request
     */
    public function rejectEmployeeScheduleRequest(Request $request, string $id)
    {
        try {
            $user = $request->user();
            $reason = $request->input('notes', $request->input('reason', 'Request rejected by admin'));
            
            $scheduleRequest = DB::table('schedule_change_requests')
                ->where('id', $id)
                ->first();
            
            if (!$scheduleRequest) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Schedule change request not found'
                ]);
            }
            
            if ($scheduleRequest->status !== 'pending') {
                return response()->json([
                    'status' => 400,
                    'message' => 'This request has already been processed'
                ]);
            }
            
            DB::table('schedule_change_requests')
                ->where('id', $id)
                ->update([
                    'status' => 'rejected',
                    'responded_by' => $user->id,
                    'responded_at' => now(),
                    'rejection_reason' => $reason,
                    'updated_at' => now(),
                ]);
            
            return response()->json([
                'status' => 200,
                'message' => 'Employee schedule change request rejected'
            ]);
        } catch (\Exception $e) {
            Log::error('Error rejecting employee schedule request: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to reject employee schedule request',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Apply the employee schedule change after approval
     * Creates schedule overrides and updates relevant records
     */
    private function applyEmployeeScheduleChange($scheduleRequest)
    {
        try {
            $userId = $scheduleRequest->user_id;
            $branchId = $scheduleRequest->branch_id;
            $overrideDate = $scheduleRequest->original_shift_date;
            
            // Get the original shift info from shift_management
            $originalShift = DB::table('shift_management')
                ->where('user_id', $userId)
                ->where('branch_id', $branchId)
                ->where('status', 'acknowledged')
                ->where(function($q) use ($overrideDate) {
                    $q->whereNull('effective_from')
                      ->orWhere('effective_from', '<=', $overrideDate);
                })
                ->where(function($q) use ($overrideDate) {
                    $q->whereNull('effective_to')
                      ->orWhere('effective_to', '>=', $overrideDate);
                })
                ->first();
            
            switch ($scheduleRequest->request_type) {
                case 'change':
                    // Create a schedule override for the specific date
                    DB::table('employee_schedule_overrides')->insert([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'user_id' => $userId,
                        'branch_id' => $branchId,
                        'schedule_change_request_id' => $scheduleRequest->id,
                        'override_date' => $scheduleRequest->requested_shift_date ?? $overrideDate,
                        'override_type' => 'shift_change',
                        'original_shift_type' => $scheduleRequest->original_shift_type,
                        'original_start_time' => $originalShift->start_time ?? null,
                        'original_end_time' => $originalShift->end_time ?? null,
                        'new_shift_type' => $scheduleRequest->requested_shift_type,
                        'new_start_time' => $originalShift->start_time ?? null, // Can be updated if needed
                        'new_end_time' => $originalShift->end_time ?? null,
                        'reason' => $scheduleRequest->reason,
                        'status' => 'active',
                        'approved_by' => auth()->id(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    
                    // If date changed, create a cancellation for the original date
                    if ($scheduleRequest->requested_shift_date && 
                        $scheduleRequest->requested_shift_date !== $overrideDate) {
                        // Cancel original date
                        DB::table('employee_schedule_overrides')->insert([
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'user_id' => $userId,
                            'branch_id' => $branchId,
                            'schedule_change_request_id' => $scheduleRequest->id,
                            'override_date' => $overrideDate,
                            'override_type' => 'cancellation',
                            'original_shift_type' => $scheduleRequest->original_shift_type,
                            'original_start_time' => $originalShift->start_time ?? null,
                            'original_end_time' => $originalShift->end_time ?? null,
                            'reason' => 'Schedule moved to ' . $scheduleRequest->requested_shift_date,
                            'status' => 'active',
                            'approved_by' => auth()->id(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                    
                    Log::info("Schedule change approved for user {$userId} - moved from {$overrideDate} to " . ($scheduleRequest->requested_shift_date ?? $overrideDate));
                    break;
                    
                case 'interchange':
                    // Swap shifts between two employees
                    if ($scheduleRequest->interchange_with) {
                        $interchangeUserId = $scheduleRequest->interchange_with;
                        
                        // Get the other employee's shift
                        $otherShift = DB::table('shift_management')
                            ->where('user_id', $interchangeUserId)
                            ->where('branch_id', $branchId)
                            ->where('status', 'acknowledged')
                            ->first();
                        
                        // Create override for original user - take the other person's shift
                        DB::table('employee_schedule_overrides')->insert([
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'user_id' => $userId,
                            'branch_id' => $branchId,
                            'schedule_change_request_id' => $scheduleRequest->id,
                            'override_date' => $overrideDate,
                            'override_type' => 'interchange',
                            'original_shift_type' => $scheduleRequest->original_shift_type,
                            'original_start_time' => $originalShift->start_time ?? null,
                            'original_end_time' => $originalShift->end_time ?? null,
                            'new_shift_type' => $otherShift->shift_type ?? null,
                            'new_start_time' => $otherShift->start_time ?? null,
                            'new_end_time' => $otherShift->end_time ?? null,
                            'interchange_with_user_id' => $interchangeUserId,
                            'reason' => $scheduleRequest->reason,
                            'status' => 'active',
                            'approved_by' => auth()->id(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        
                        // Create override for the other employee - take the original user's shift
                        DB::table('employee_schedule_overrides')->insert([
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'user_id' => $interchangeUserId,
                            'branch_id' => $branchId,
                            'schedule_change_request_id' => $scheduleRequest->id,
                            'override_date' => $overrideDate,
                            'override_type' => 'interchange',
                            'original_shift_type' => $otherShift->shift_type ?? null,
                            'original_start_time' => $otherShift->start_time ?? null,
                            'original_end_time' => $otherShift->end_time ?? null,
                            'new_shift_type' => $scheduleRequest->original_shift_type,
                            'new_start_time' => $originalShift->start_time ?? null,
                            'new_end_time' => $originalShift->end_time ?? null,
                            'interchange_with_user_id' => $userId,
                            'reason' => 'Shift interchange with ' . $userId,
                            'status' => 'active',
                            'approved_by' => auth()->id(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        
                        Log::info("Shift interchange approved between user {$userId} and {$interchangeUserId} on {$overrideDate}");
                    }
                    break;
                    
                case 'time_off':
                    // Record time off as an override
                    DB::table('employee_schedule_overrides')->insert([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'user_id' => $userId,
                        'branch_id' => $branchId,
                        'schedule_change_request_id' => $scheduleRequest->id,
                        'override_date' => $overrideDate,
                        'override_type' => 'time_off',
                        'original_shift_type' => $scheduleRequest->original_shift_type,
                        'original_start_time' => $originalShift->start_time ?? null,
                        'original_end_time' => $originalShift->end_time ?? null,
                        'new_shift_type' => null, // No work on this day
                        'new_start_time' => null,
                        'new_end_time' => null,
                        'reason' => $scheduleRequest->reason,
                        'status' => 'active',
                        'approved_by' => auth()->id(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    
                    Log::info("Time off approved for user {$userId} on {$overrideDate}");
                    break;
                    
                case 'cancellation':
                    // Cancel the shift for this date
                    DB::table('employee_schedule_overrides')->insert([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'user_id' => $userId,
                        'branch_id' => $branchId,
                        'schedule_change_request_id' => $scheduleRequest->id,
                        'override_date' => $overrideDate,
                        'override_type' => 'cancellation',
                        'original_shift_type' => $scheduleRequest->original_shift_type,
                        'original_start_time' => $originalShift->start_time ?? null,
                        'original_end_time' => $originalShift->end_time ?? null,
                        'new_shift_type' => null,
                        'new_start_time' => null,
                        'new_end_time' => null,
                        'reason' => $scheduleRequest->reason,
                        'status' => 'active',
                        'approved_by' => auth()->id(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    
                    Log::info("Shift cancellation approved for user {$userId} on {$overrideDate}");
                    break;
            }
        } catch (\Exception $e) {
            Log::error('Error applying employee schedule change: ' . $e->getMessage());
            throw $e; // Re-throw so the parent method can handle it
        }
    }
}
