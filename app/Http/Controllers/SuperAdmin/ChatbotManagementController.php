<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ChatbotFaq;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ChatbotManagementController extends Controller
{
    /**
     * Get all FAQs with optional filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = ChatbotFaq::query();

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $faqs = $query->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'status' => 200,
            'data' => $faqs
        ]);
    }

    /**
     * Create a new FAQ
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'required|string|in:general_homeopathy,doctor_info,hospital_info,appointment,admin_faq,doctor_capability',
            'question_en' => 'required|string|max:500',
            'answer_en' => 'required|string|max:2000',
            'question_si' => 'nullable|string|max:500',
            'answer_si' => 'nullable|string|max:2000',
            'keywords' => 'nullable|array',
            'keywords.*' => 'string|max:50',
            'is_active' => 'boolean',
            'priority' => 'integer|min:0|max:100',
        ]);

        try {
            $faq = ChatbotFaq::create([
                ...$validated,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'FAQ created successfully',
                'data' => $faq
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating FAQ: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create FAQ'
            ], 500);
        }
    }

    /**
     * Update an existing FAQ
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $faq = ChatbotFaq::findOrFail($id);

        $validated = $request->validate([
            'category' => 'string|in:general_homeopathy,doctor_info,hospital_info,appointment,admin_faq,doctor_capability',
            'question_en' => 'string|max:500',
            'answer_en' => 'string|max:2000',
            'question_si' => 'nullable|string|max:500',
            'answer_si' => 'nullable|string|max:2000',
            'keywords' => 'nullable|array',
            'keywords.*' => 'string|max:50',
            'is_active' => 'boolean',
            'priority' => 'integer|min:0|max:100',
        ]);

        try {
            $faq->update($validated);

            return response()->json([
                'status' => 200,
                'message' => 'FAQ updated successfully',
                'data' => $faq
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating FAQ: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update FAQ'
            ], 500);
        }
    }

    /**
     * Delete a FAQ
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            ChatbotFaq::findOrFail($id)->delete();

            return response()->json([
                'status' => 200,
                'message' => 'FAQ deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete FAQ'
            ], 500);
        }
    }

    /**
     * Toggle FAQ active status
     */
    public function toggleStatus(string $id): JsonResponse
    {
        try {
            $faq = ChatbotFaq::findOrFail($id);
            $faq->is_active = !$faq->is_active;
            $faq->save();

            return response()->json([
                'status' => 200,
                'message' => 'FAQ status updated',
                'data' => ['is_active' => $faq->is_active]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update FAQ status'
            ], 500);
        }
    }

    /**
     * Get all disease mappings
     */
    public function getDiseaseMappings(): JsonResponse
    {
        $mappings = DB::table('chatbot_disease_mappings')
            ->orderBy('disease_name')
            ->get();

        return response()->json([
            'status' => 200,
            'data' => $mappings
        ]);
    }

    /**
     * Create a disease mapping
     */
    public function createDiseaseMapping(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'disease_name' => 'required|string|max:100',
            'specialization' => 'required|string|max:100',
            'safe_response' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        try {
            $id = DB::table('chatbot_disease_mappings')->insertGetId([
                'id' => \Illuminate\Support\Str::uuid(),
                'disease_name' => $validated['disease_name'],
                'specialization' => $validated['specialization'],
                'safe_response' => $validated['safe_response'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Disease mapping created successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create disease mapping'
            ], 500);
        }
    }

    /**
     * Update a disease mapping
     */
    public function updateDiseaseMapping(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'disease_name' => 'string|max:100',
            'specialization' => 'string|max:100',
            'safe_response' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        try {
            DB::table('chatbot_disease_mappings')
                ->where('id', $id)
                ->update([
                    ...$validated,
                    'updated_at' => now(),
                ]);

            return response()->json([
                'status' => 200,
                'message' => 'Disease mapping updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update disease mapping'
            ], 500);
        }
    }

    /**
     * Delete a disease mapping
     */
    public function deleteDiseaseMapping(string $id): JsonResponse
    {
        try {
            DB::table('chatbot_disease_mappings')->where('id', $id)->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Disease mapping deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete disease mapping'
            ], 500);
        }
    }

    /**
     * Get chatbot logs for analysis
     */
    public function getLogs(Request $request): JsonResponse
    {
        $query = DB::table('chatbot_logs');

        if ($request->has('category')) {
            $query->where('category_detected', $request->category);
        }

        if ($request->has('was_helpful')) {
            $query->where('was_helpful', $request->boolean('was_helpful'));
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json([
            'status' => 200,
            'data' => $logs
        ]);
    }

    /**
     * Get chatbot analytics
     */
    public function getAnalytics(): JsonResponse
    {
        $totalQuestions = DB::table('chatbot_logs')->count();
        $helpfulResponses = DB::table('chatbot_logs')->where('was_helpful', true)->count();
        $notHelpfulResponses = DB::table('chatbot_logs')->where('was_helpful', false)->count();

        $categoryBreakdown = DB::table('chatbot_logs')
            ->select('category_detected', DB::raw('count(*) as count'))
            ->groupBy('category_detected')
            ->get();

        $recentActivity = DB::table('chatbot_logs')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return response()->json([
            'status' => 200,
            'data' => [
                'total_questions' => $totalQuestions,
                'helpful_responses' => $helpfulResponses,
                'not_helpful_responses' => $notHelpfulResponses,
                'satisfaction_rate' => $totalQuestions > 0 
                    ? round(($helpfulResponses / max($helpfulResponses + $notHelpfulResponses, 1)) * 100, 1) 
                    : 0,
                'category_breakdown' => $categoryBreakdown,
                'recent_activity' => $recentActivity,
            ]
        ]);
    }

    /**
     * Get available categories
     */
    public function getCategories(): JsonResponse
    {
        return response()->json([
            'status' => 200,
            'data' => [
                ['value' => 'general_homeopathy', 'label' => 'General Homeopathy'],
                ['value' => 'doctor_info', 'label' => 'Doctor Information'],
                ['value' => 'hospital_info', 'label' => 'Hospital Information'],
                ['value' => 'appointment', 'label' => 'Appointments'],
                ['value' => 'admin_faq', 'label' => 'Admin FAQ'],
            ]
        ]);
    }
}
