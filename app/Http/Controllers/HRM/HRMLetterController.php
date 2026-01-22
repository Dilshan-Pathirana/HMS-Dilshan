<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * STEP 16 & 17: HR Letters Controller
 * Manages work confirmation letters, service period certificates, etc.
 */
class HRMLetterController extends Controller
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
        // role_as: 1 = super_admin
        return $user && $user->role_as === 1;
    }

    private function isBranchAdmin($user): bool
    {
        // role_as: 2 = branch_admin
        return $user && $user->role_as === 2;
    }

    /**
     * Get available letter templates
     */
    public function getLetterTemplates(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $templates = DB::table('hr_letter_templates')
            ->where('is_active', true)
            ->select('id', 'code', 'name', 'letter_type', 'requires_approval')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $templates
        ]);
    }

    /**
     * Request a letter (Employee self-service)
     */
    public function requestLetter(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'template_id' => 'required|uuid|exists:hr_letter_templates,id',
            'purpose' => 'required|string|max:500',
            'addressed_to' => 'nullable|string|max:255',
            'required_by' => 'nullable|date|after:today'
        ]);

        // Generate reference number
        $referenceNumber = 'LTR-' . date('Ymd') . '-' . strtoupper(Str::random(4));

        $letterId = Str::uuid()->toString();

        DB::table('hr_letter_requests')->insert([
            'id' => $letterId,
            'user_id' => $user->id,
            'template_id' => $request->template_id,
            'reference_number' => $referenceNumber,
            'purpose' => $request->purpose,
            'addressed_to' => $request->addressed_to,
            'required_by' => $request->required_by,
            'status' => 'pending',
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Letter request submitted successfully',
            'data' => [
                'id' => $letterId,
                'reference_number' => $referenceNumber
            ]
        ], 201);
    }

    /**
     * Get my letter requests (Employee)
     */
    public function getMyLetterRequests(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $requests = DB::table('hr_letter_requests as lr')
            ->join('hr_letter_templates as lt', 'lr.template_id', '=', 'lt.id')
            ->where('lr.user_id', $user->id)
            ->whereNull('lr.deleted_at')
            ->select(
                'lr.id',
                'lr.reference_number',
                'lt.name as template_name',
                'lt.letter_type',
                'lr.purpose',
                'lr.status',
                'lr.required_by',
                'lr.created_at',
                'lr.processed_at',
                'lr.rejection_reason'
            )
            ->orderBy('lr.created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests
        ]);
    }

    /**
     * Get pending letter requests (Admin)
     */
    public function getPendingRequests(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $query = DB::table('hr_letter_requests as lr')
            ->join('hr_letter_templates as lt', 'lr.template_id', '=', 'lt.id')
            ->join('users as u', 'lr.user_id', '=', 'u.id')
            ->where('lr.status', 'pending')
            ->whereNull('lr.deleted_at')
            ->select(
                'lr.*',
                'lt.name as template_name',
                'lt.letter_type',
                'u.first_name',
                'u.last_name',
                'u.employee_id',
                'u.designation',
                'u.branch_id'
            );

        if ($this->isBranchAdmin($user) && !$this->isSuperAdmin($user)) {
            $query->where('u.branch_id', $user->branch_id);
        }

        $requests = $query->orderBy('lr.required_by', 'asc')
            ->orderBy('lr.created_at', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests
        ]);
    }

    /**
     * Process letter request (approve/reject)
     */
    public function processRequest(Request $request, $requestId)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'action' => 'required|in:approve,reject',
            'rejection_reason' => 'nullable|required_if:action,reject|string|max:500',
            'admin_remarks' => 'nullable|string|max:500'
        ]);

        $letterRequest = DB::table('hr_letter_requests')
            ->where('id', $requestId)
            ->whereNull('deleted_at')
            ->first();

        if (!$letterRequest) {
            return response()->json(['status' => 'error', 'message' => 'Request not found'], 404);
        }

        if ($letterRequest->status !== 'pending') {
            return response()->json(['status' => 'error', 'message' => 'Request already processed'], 400);
        }

        if ($request->action === 'reject') {
            DB::table('hr_letter_requests')
                ->where('id', $requestId)
                ->update([
                    'status' => 'rejected',
                    'processed_by' => $user->id,
                    'processed_at' => now(),
                    'rejection_reason' => $request->rejection_reason,
                    'updated_at' => now()
                ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Letter request rejected'
            ]);
        }

        // Approve - generate the letter
        $generatedContent = $this->generateLetter($letterRequest);

        DB::table('hr_letter_requests')
            ->where('id', $requestId)
            ->update([
                'status' => 'generated',
                'processed_by' => $user->id,
                'processed_at' => now(),
                'generated_content' => $generatedContent,
                'admin_remarks' => $request->input('admin_remarks'),
                'updated_at' => now()
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Letter generated successfully'
        ]);
    }

    /**
     * Generate letter content from template
     */
    private function generateLetter($letterRequest)
    {
        $template = DB::table('hr_letter_templates')
            ->where('id', $letterRequest->template_id)
            ->first();

        $employee = DB::table('users')
            ->where('id', $letterRequest->user_id)
            ->first();

        $branch = DB::table('branches')
            ->where('id', $employee->branch_id ?? null)
            ->first();

        // Calculate service period
        $joinDate = $employee->date_of_joining ?? $employee->created_at;
        $serviceYears = 0;
        $serviceMonths = 0;
        if ($joinDate) {
            $diff = now()->diff($joinDate);
            $serviceYears = $diff->y;
            $serviceMonths = $diff->m;
        }

        // Template variable replacements
        $variables = [
            '{{company_name}}' => config('app.name', 'Hospital Management System'),
            '{{company_address}}' => $branch->address ?? 'Company Address',
            '{{date}}' => now()->format('d F, Y'),
            '{{reference_number}}' => $letterRequest->reference_number,
            '{{employee_name}}' => ($employee->first_name ?? '') . ' ' . ($employee->last_name ?? ''),
            '{{nic}}' => $employee->nic ?? 'N/A',
            '{{designation}}' => $employee->designation ?? 'Employee',
            '{{department}}' => $employee->department ?? 'General',
            '{{join_date}}' => $joinDate ? date('d F, Y', strtotime($joinDate)) : 'N/A',
            '{{start_date}}' => $joinDate ? date('d F, Y', strtotime($joinDate)) : 'N/A',
            '{{end_date}}' => now()->format('d F, Y'),
            '{{service_years}}' => $serviceYears,
            '{{service_months}}' => $serviceMonths,
            '{{purpose}}' => $letterRequest->purpose ?? 'official purposes',
            '{{basic_salary}}' => number_format($employee->basic_salary ?? 0, 2),
            '{{allowances}}' => '0.00',
            '{{gross_salary}}' => number_format($employee->basic_salary ?? 0, 2),
            '{{performance_remarks}}' => 'excellent performance and dedication',
            '{{employee_id}}' => $employee->employee_id ?? $employee->id
        ];

        $content = $template->template_content;
        foreach ($variables as $key => $value) {
            $content = str_replace($key, $value, $content);
        }

        return $content;
    }

    /**
     * Get letter details (view generated letter)
     */
    public function getLetterDetails(Request $request, $requestId)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $letterRequest = DB::table('hr_letter_requests as lr')
            ->join('hr_letter_templates as lt', 'lr.template_id', '=', 'lt.id')
            ->where('lr.id', $requestId)
            ->whereNull('lr.deleted_at')
            ->select('lr.*', 'lt.name as template_name', 'lt.letter_type', 'lt.footer_text')
            ->first();

        if (!$letterRequest) {
            return response()->json(['status' => 'error', 'message' => 'Request not found'], 404);
        }

        // Check access
        if (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user) && $user->id !== $letterRequest->user_id) {
            return response()->json(['status' => 'error', 'message' => 'Access denied'], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => $letterRequest
        ]);
    }

    /**
     * Mark letter as collected
     */
    public function markCollected(Request $request, $requestId)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $letterRequest = DB::table('hr_letter_requests')
            ->where('id', $requestId)
            ->where('status', 'generated')
            ->first();

        if (!$letterRequest) {
            return response()->json(['status' => 'error', 'message' => 'Letter not found or not ready'], 404);
        }

        DB::table('hr_letter_requests')
            ->where('id', $requestId)
            ->update([
                'status' => 'collected',
                'collected_at' => now(),
                'updated_at' => now()
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Letter marked as collected'
        ]);
    }

    /**
     * Get letter request statistics
     */
    public function getLetterStats(Request $request)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $currentMonth = date('Y-m');

        $stats = [
            'pending' => DB::table('hr_letter_requests')
                ->where('status', 'pending')
                ->whereNull('deleted_at')
                ->count(),
            'generated_this_month' => DB::table('hr_letter_requests')
                ->whereIn('status', ['generated', 'collected'])
                ->whereRaw("strftime('%Y-%m', processed_at) = ?", [$currentMonth])
                ->whereNull('deleted_at')
                ->count(),
            'by_type' => DB::table('hr_letter_requests as lr')
                ->join('hr_letter_templates as lt', 'lr.template_id', '=', 'lt.id')
                ->whereNull('lr.deleted_at')
                ->select('lt.letter_type', DB::raw('count(*) as count'))
                ->groupBy('lt.letter_type')
                ->get()
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }

    /**
     * Preview letter content before approval (generates a preview without saving)
     */
    public function previewLetter(Request $request, $requestId)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $letterRequest = DB::table('hr_letter_requests')
            ->where('id', $requestId)
            ->whereNull('deleted_at')
            ->first();

        if (!$letterRequest) {
            return response()->json(['status' => 'error', 'message' => 'Request not found'], 404);
        }

        // If already generated, return the saved content
        if ($letterRequest->generated_content) {
            return response()->json([
                'status' => 'success',
                'content' => $letterRequest->generated_content
            ]);
        }

        // Generate a preview
        $previewContent = $this->generateLetter($letterRequest);

        return response()->json([
            'status' => 'success',
            'content' => $previewContent
        ]);
    }

    /**
     * Update letter content (admin can edit the letter content)
     */
    public function updateLetterContent(Request $request, $requestId)
    {
        $user = $this->validateToken($request);
        if (!$user || (!$this->isSuperAdmin($user) && !$this->isBranchAdmin($user))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'content' => 'required|string'
        ]);

        $letterRequest = DB::table('hr_letter_requests')
            ->where('id', $requestId)
            ->whereNull('deleted_at')
            ->first();

        if (!$letterRequest) {
            return response()->json(['status' => 'error', 'message' => 'Request not found'], 404);
        }

        // Update the generated content
        DB::table('hr_letter_requests')
            ->where('id', $requestId)
            ->update([
                'generated_content' => $request->content,
                'updated_at' => now()
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Letter content updated successfully'
        ]);
    }

    /**
     * Get generated letter for cashier (for printing/downloading)
     */
    public function getMyLetterContent(Request $request, $requestId)
    {
        $user = $this->validateToken($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $letterRequest = DB::table('hr_letter_requests as lr')
            ->join('hr_letter_templates as lt', 'lr.template_id', '=', 'lt.id')
            ->where('lr.id', $requestId)
            ->where('lr.user_id', $user->id)
            ->whereIn('lr.status', ['generated', 'collected'])
            ->whereNull('lr.deleted_at')
            ->select(
                'lr.*',
                'lt.name as template_name',
                'lt.letter_type',
                'lt.footer_text'
            )
            ->first();

        if (!$letterRequest) {
            return response()->json(['status' => 'error', 'message' => 'Letter not found or not ready'], 404);
        }

        // Get employee details for the response
        $employee = DB::table('users')
            ->where('id', $letterRequest->user_id)
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $letterRequest->id,
                'reference_number' => $letterRequest->reference_number,
                'template_name' => $letterRequest->template_name,
                'letter_type' => $letterRequest->letter_type,
                'content' => $letterRequest->generated_content,
                'status' => $letterRequest->status,
                'processed_at' => $letterRequest->processed_at,
                'employee_name' => ($employee->first_name ?? '') . ' ' . ($employee->last_name ?? ''),
                'designation' => $employee->designation ?? 'Employee',
                'footer_text' => $letterRequest->footer_text
            ]
        ]);
    }
}
