<?php

namespace App\Http\Controllers\BranchAdmin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\AllUsers\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BranchAdminFeedbackController extends Controller
{
    /**
     * Get feedbacks submitted by the current authenticated user (for patients)
     */
    public function getMyFeedbacks(Request $request)
    {
        try {
            $user = Auth::user();

            $feedbacks = Feedback::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 200,
                'feedbacks' => $feedbacks
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch your feedbacks',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all feedbacks for the branch admin's branch
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $query = Feedback::query();

            // Filter by branch if branch admin (not super admin)
            if ($user->role_as !== 1) {
                $query->where(function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId)
                      ->orWhereNull('branch_id');
                });
            } else {
                // Super admin can filter by specific branch_id
                if ($request->has('branch_id') && $request->branch_id !== 'all' && !empty($request->branch_id)) {
                    $query->where('branch_id', $request->branch_id);
                }
            }

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter by category
            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            // Filter by user type
            if ($request->has('user_type') && $request->user_type !== 'all') {
                $query->where('user_type', $request->user_type);
            }

            // Filter by priority
            if ($request->has('priority') && $request->priority !== 'all') {
                $query->where('priority', $request->priority);
            }

            // Filter by flagged
            if ($request->has('flagged') && $request->flagged === 'true') {
                $query->where('is_flagged', true);
            }

            // Search
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('subject', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('user_name', 'like', "%{$search}%");
                });
            }

            // Order by latest first
            $query->orderBy('created_at', 'desc');

            $feedbacks = $query->paginate($request->per_page ?? 20);

            return response()->json([
                'status' => 200,
                'feedbacks' => $feedbacks->items(),
                'pagination' => [
                    'current_page' => $feedbacks->currentPage(),
                    'last_page' => $feedbacks->lastPage(),
                    'per_page' => $feedbacks->perPage(),
                    'total' => $feedbacks->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch feedbacks',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get feedback statistics
     */
    public function getStats(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $query = Feedback::query();

            // Filter by branch if branch admin
            if ($user->role_as !== 1) {
                $query->where(function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId)
                      ->orWhereNull('branch_id');
                });
            } else {
                // Super admin can filter by specific branch_id
                if ($request->has('branch_id') && $request->branch_id !== 'all' && !empty($request->branch_id)) {
                    $query->where('branch_id', $request->branch_id);
                }
            }

            $stats = [
                'total' => (clone $query)->count(),
                'pending' => (clone $query)->where('status', 'pending')->count(),
                'in_review' => (clone $query)->where('status', 'in-review')->count(),
                'responded' => (clone $query)->where('status', 'responded')->count(),
                'resolved' => (clone $query)->where('status', 'resolved')->count(),
                'flagged' => (clone $query)->where('is_flagged', true)->count(),
                'by_category' => [
                    'service' => (clone $query)->where('category', 'service')->count(),
                    'facility' => (clone $query)->where('category', 'facility')->count(),
                    'staff' => (clone $query)->where('category', 'staff')->count(),
                    'medical' => (clone $query)->where('category', 'medical')->count(),
                    'billing' => (clone $query)->where('category', 'billing')->count(),
                    'general' => (clone $query)->where('category', 'general')->count(),
                    'suggestion' => (clone $query)->where('category', 'suggestion')->count(),
                    'complaint' => (clone $query)->where('category', 'complaint')->count(),
                ],
                'by_user_type' => [
                    'patient' => (clone $query)->where('user_type', 'patient')->count(),
                    'staff' => (clone $query)->whereNotIn('user_type', ['patient'])->count(),
                ],
                'average_rating' => (clone $query)->whereNotNull('rating')->avg('rating') ?? 0,
            ];

            return response()->json([
                'status' => 200,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single feedback details
     */
    public function show($id)
    {
        try {
            $feedback = Feedback::findOrFail($id);

            return response()->json([
                'status' => 200,
                'feedback' => $feedback
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Feedback not found'
            ], 404);
        }
    }

    /**
     * Respond to feedback
     */
    public function respond(Request $request, $id)
    {
        try {
            $request->validate([
                'response' => 'required|string|max:2000',
            ]);

            $user = Auth::user();
            $feedback = Feedback::findOrFail($id);

            $feedback->update([
                'admin_response' => $request->response,
                'responded_by' => $user->id,
                'responded_by_name' => $user->first_name . ' ' . $user->last_name,
                'responded_at' => now(),
                'status' => 'responded',
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Response sent successfully',
                'feedback' => $feedback->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to send response',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update feedback status
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $request->validate([
                'status' => 'required|in:pending,in-review,responded,resolved,closed',
            ]);

            $feedback = Feedback::findOrFail($id);
            $feedback->update(['status' => $request->status]);

            return response()->json([
                'status' => 200,
                'message' => 'Status updated successfully',
                'feedback' => $feedback->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Flag/unflag feedback
     */
    public function toggleFlag(Request $request, $id)
    {
        try {
            $feedback = Feedback::findOrFail($id);
            
            $feedback->update([
                'is_flagged' => !$feedback->is_flagged,
                'flag_reason' => $request->reason ?? null,
            ]);

            return response()->json([
                'status' => 200,
                'message' => $feedback->is_flagged ? 'Feedback flagged' : 'Flag removed',
                'feedback' => $feedback->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to toggle flag',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update internal notes
     */
    public function updateNotes(Request $request, $id)
    {
        try {
            $request->validate([
                'notes' => 'nullable|string|max:2000',
            ]);

            $feedback = Feedback::findOrFail($id);
            $feedback->update(['internal_notes' => $request->notes]);

            return response()->json([
                'status' => 200,
                'message' => 'Notes updated successfully',
                'feedback' => $feedback->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update notes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update priority
     */
    public function updatePriority(Request $request, $id)
    {
        try {
            $request->validate([
                'priority' => 'required|in:low,medium,high,urgent',
            ]);

            $feedback = Feedback::findOrFail($id);
            $feedback->update(['priority' => $request->priority]);

            return response()->json([
                'status' => 200,
                'message' => 'Priority updated successfully',
                'feedback' => $feedback->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update priority',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit new feedback (from patients/staff)
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'type' => 'nullable|in:suggestion,complaint,praise,question',
                'category' => 'required|in:general,system,inventory,customer_service,work_environment,management,other,service,facility,staff,medical,billing,suggestion,complaint',
                'subject' => 'required|string|max:255',
                'description' => 'required|string|max:5000',
                'rating' => 'nullable|integer|min:1|max:5',
                'experience' => 'nullable|in:positive,neutral,negative',
                'branch_id' => 'nullable|string',
                'doctor_id' => 'nullable|string',
                'is_anonymous' => 'nullable|boolean',
            ]);

            $user = Auth::user();
            
            // Determine user type based on correct role_as values
            // 1=Super Admin, 2=Branch Admin, 3=Doctor, 4=Nurse, 5=Patient, 6=Cashier, 7=Pharmacist
            $userType = 'patient';
            if ($user->role_as == 1) $userType = 'super_admin';
            elseif ($user->role_as == 2) $userType = 'branch_admin';
            elseif ($user->role_as == 3) $userType = 'doctor';
            elseif ($user->role_as == 4) $userType = 'nurse';
            elseif ($user->role_as == 5) $userType = 'patient';
            elseif ($user->role_as == 6) $userType = 'cashier';
            elseif ($user->role_as == 7) $userType = 'pharmacist';
            elseif (strtolower($user->user_type ?? '') === 'receptionist') $userType = 'receptionist';

            // Get branch name if provided
            $branchName = null;
            if ($request->branch_id) {
                $branch = \App\Models\Branch::find($request->branch_id);
                $branchName = $branch ? $branch->center_name : null;
            }

            // Get doctor name if provided
            $doctorName = null;
            if ($request->doctor_id) {
                $doctor = User::find($request->doctor_id);
                $doctorName = $doctor ? 'Dr. ' . $doctor->first_name . ' ' . $doctor->last_name : null;
            }

            $feedback = Feedback::create([
                'user_id' => $user->id,
                'user_type' => $userType,
                'user_name' => $request->is_anonymous ? 'Anonymous' : ($user->first_name . ' ' . $user->last_name),
                'branch_id' => $request->branch_id ?? $user->branch_id,
                'branch_name' => $branchName,
                'doctor_id' => $request->doctor_id,
                'doctor_name' => $doctorName,
                'category' => $request->category,
                'subject' => $request->subject,
                'description' => $request->description,
                'rating' => $request->rating,
                'experience' => $request->experience,
                'is_anonymous' => $request->is_anonymous ?? false,
                'priority' => 'medium',
                'status' => 'pending',
            ]);

            // Create notification for branch admins when a complaint is submitted
            if (in_array($request->category, ['complaint', 'medical', 'service', 'facility', 'billing'])) {
                $this->notifyBranchAdmins($feedback, $branchName);
            }

            return response()->json([
                'status' => 201,
                'message' => 'Feedback submitted successfully',
                'feedback' => $feedback
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to submit feedback',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Notify branch admins about new complaint/feedback
     */
    private function notifyBranchAdmins(Feedback $feedback, ?string $branchName)
    {
        // Get the branch ID from the feedback
        $branchId = $feedback->branch_id;

        // Find all branch admins for this branch (role_as = 2)
        $branchAdmins = User::where('role_as', 2)
            ->when($branchId, function ($query) use ($branchId) {
                return $query->where('branch_id', $branchId);
            })
            ->get();

        // If no specific branch admins found, notify all branch admins
        if ($branchAdmins->isEmpty()) {
            $branchAdmins = User::where('role_as', 2)->get();
        }

        $categoryLabel = ucfirst($feedback->category);
        $userName = $feedback->is_anonymous ? 'Anonymous User' : $feedback->user_name;
        
        foreach ($branchAdmins as $admin) {
            // Insert into notification_management table (the correct table used by the system)
            DB::table('notification_management')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $admin->id,
                'notification_type' => 'feedback',
                'notification_message' => "New {$categoryLabel} from {$userName}: \"{$feedback->subject}\"",
                'notification_status' => 'unread',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
