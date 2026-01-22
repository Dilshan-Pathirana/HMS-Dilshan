<?php

namespace App\Http\Controllers\MedicalInsights;

use App\Http\Controllers\Controller;
use App\Models\MedicalInsights\MedicalPost;
use App\Models\MedicalInsights\PostComment;
use App\Models\MedicalInsights\PostQuestion;
use App\Models\MedicalInsights\PostView;
use App\Models\MedicalInsights\PostLike;
use App\Models\MedicalInsights\PostRating;
use App\Models\MedicalInsights\MedicalInsightsAuditLog;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;

class MedicalInsightsController extends Controller
{
    // ============================================
    // PUBLIC ENDPOINTS (No Auth Required)
    // ============================================

    /**
     * Get all published posts with filters
     */
    public function getPosts(Request $request)
    {
        try {
            $user = Auth::guard('sanctum')->user();
            
            $query = MedicalPost::published()
                ->visibleTo($user)
                ->with(['doctor:id,name,specialization,profile_picture']);

            // Category filter
            if ($request->has('category') && $request->category) {
                $query->byCategory($request->category);
            }

            // Search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('short_description', 'like', "%{$search}%");
                });
            }

            // Doctor filter
            if ($request->has('doctor_id') && $request->doctor_id) {
                $query->byDoctor($request->doctor_id);
            }

            // Sorting
            $sortBy = $request->get('sort', 'latest');
            switch ($sortBy) {
                case 'popular':
                    $query->orderBy('view_count', 'desc');
                    break;
                case 'most_liked':
                    $query->orderBy('like_count', 'desc');
                    break;
                default:
                    $query->orderBy('published_at', 'desc');
            }

            $posts = $query->paginate($request->get('per_page', 12));

            return response()->json([
                'status' => 200,
                'data' => $posts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch posts',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single post by slug
     */
    public function getPost($slug, Request $request)
    {
        try {
            $user = Auth::guard('sanctum')->user();

            $post = MedicalPost::where('slug', $slug)
                ->published()
                ->visibleTo($user)
                ->with([
                    'doctor:id,name,specialization,profile_picture,email',
                    'visibleComments' => function ($q) {
                        $q->topLevel()
                          ->with(['user:id,name,profile_picture,role_as', 'visibleReplies.user:id,name,profile_picture,role_as'])
                          ->orderBy('created_at', 'desc')
                          ->limit(20);
                    },
                    'visibleQuestions' => function ($q) {
                        $q->with(['patient:id,name,profile_picture', 'answeredBy:id,name,specialization'])
                          ->orderBy('created_at', 'desc')
                          ->limit(20);
                    },
                ])
                ->first();

            if (!$post) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Post not found',
                ], 404);
            }

            // Record view
            $this->recordView($post, $user, $request);

            // Check if user has liked
            $hasLiked = false;
            $userRating = null;
            if ($user) {
                $hasLiked = PostLike::where('post_id', $post->id)
                    ->where('user_id', $user->id)
                    ->exists();
                $userRating = PostRating::where('post_id', $post->id)
                    ->where('user_id', $user->id)
                    ->first();
            }

            return response()->json([
                'status' => 200,
                'data' => [
                    'post' => $post,
                    'has_liked' => $hasLiked,
                    'user_rating' => $userRating,
                    'average_rating' => $post->average_rating,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch post',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get post categories with counts
     */
    public function getCategories()
    {
        try {
            $categories = [
                ['id' => 'success_story', 'label' => 'Success Stories', 'icon' => 'trophy'],
                ['id' => 'medical_finding', 'label' => 'Medical Findings', 'icon' => 'microscope'],
                ['id' => 'video_vlog', 'label' => 'Video Vlogs', 'icon' => 'video'],
                ['id' => 'research_article', 'label' => 'Research Articles', 'icon' => 'file-text'],
            ];

            foreach ($categories as &$cat) {
                $cat['count'] = MedicalPost::published()
                    ->where('visibility', 'public')
                    ->where('category', $cat['id'])
                    ->count();
            }

            return response()->json([
                'status' => 200,
                'data' => $categories,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch categories',
            ], 500);
        }
    }

    // ============================================
    // AUTHENTICATED ENDPOINTS
    // ============================================

    /**
     * Like/Unlike a post
     */
    public function toggleLike($postId)
    {
        try {
            $user = Auth::user();
            $post = MedicalPost::findOrFail($postId);

            $existingLike = PostLike::where('post_id', $postId)
                ->where('user_id', $user->id)
                ->first();

            if ($existingLike) {
                $existingLike->delete();
                $post->decrementLikeCount();
                $liked = false;
            } else {
                PostLike::create([
                    'post_id' => $postId,
                    'user_id' => $user->id,
                ]);
                $post->incrementLikeCount();
                $liked = true;
            }

            return response()->json([
                'status' => 200,
                'liked' => $liked,
                'like_count' => $post->fresh()->like_count,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to toggle like',
            ], 500);
        }
    }

    /**
     * Rate a post
     */
    public function ratePost(Request $request, $postId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'rating' => 'required|integer|min:1|max:5',
                'feedback' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $post = MedicalPost::findOrFail($postId);

            $rating = PostRating::updateOrCreate(
                ['post_id' => $postId, 'user_id' => $user->id],
                ['rating' => $request->rating, 'feedback' => $request->feedback]
            );

            return response()->json([
                'status' => 200,
                'message' => 'Rating submitted successfully',
                'average_rating' => $post->fresh()->average_rating,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to submit rating',
            ], 500);
        }
    }

    /**
     * Add a comment
     */
    public function addComment(Request $request, $postId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'content' => 'required|string|max:1000',
                'parent_id' => 'nullable|uuid|exists:post_comments,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $post = MedicalPost::findOrFail($postId);

            $comment = PostComment::create([
                'post_id' => $postId,
                'user_id' => $user->id,
                'parent_id' => $request->parent_id,
                'content' => $request->content,
                'status' => 'visible',
            ]);

            $post->updateCommentCount();

            // Log
            MedicalInsightsAuditLog::log($user, 'add_comment', 'comment', $comment->id, null, [
                'post_id' => $postId,
                'content' => $request->content,
            ]);

            // Notify post author
            if ($post->doctor_id !== $user->id) {
                Notification::create([
                    'user_id' => $post->doctor_id,
                    'type' => 'post_comment',
                    'title' => 'New Comment on Your Post',
                    'message' => "{$user->name} commented on your post: \"{$post->title}\"",
                    'link' => "/medical-insights/{$post->slug}",
                    'is_read' => false,
                ]);
            }

            return response()->json([
                'status' => 201,
                'message' => 'Comment added successfully',
                'data' => $comment->load('user:id,name,profile_picture,role_as'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to add comment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ask a question (Patients only)
     */
    public function askQuestion(Request $request, $postId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'question' => 'required|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();

            // Only patients can ask questions
            if ($user->role_as !== 5) {
                return response()->json([
                    'status' => 403,
                    'message' => 'Only patients can ask questions',
                ], 403);
            }

            $post = MedicalPost::findOrFail($postId);

            $question = PostQuestion::create([
                'post_id' => $postId,
                'patient_id' => $user->id,
                'question' => $request->question,
                'status' => 'pending',
            ]);

            $post->updateQuestionCount();

            // Log
            MedicalInsightsAuditLog::log($user, 'ask_question', 'question', $question->id, null, [
                'post_id' => $postId,
                'question' => $request->question,
            ]);

            // Notify doctor
            Notification::create([
                'user_id' => $post->doctor_id,
                'type' => 'patient_question',
                'title' => 'New Question on Your Post',
                'message' => "A patient asked a question on your post: \"{$post->title}\"",
                'link' => "/medical-insights/{$post->slug}",
                'is_read' => false,
            ]);

            return response()->json([
                'status' => 201,
                'message' => 'Question submitted successfully',
                'data' => $question->load('patient:id,name,profile_picture'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to submit question',
            ], 500);
        }
    }

    // ============================================
    // DOCTOR ENDPOINTS
    // ============================================

    /**
     * Get doctor's own posts
     */
    public function getDoctorPosts(Request $request)
    {
        try {
            $user = Auth::user();

            // Only doctors (role_as = 3)
            if ($user->role_as !== 3) {
                return response()->json([
                    'status' => 403,
                    'message' => 'Access denied',
                ], 403);
            }

            $query = MedicalPost::where('doctor_id', $user->id)
                ->withCount(['visibleComments', 'visibleQuestions']);

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            $posts = $query->orderBy('created_at', 'desc')->paginate(10);

            return response()->json([
                'status' => 200,
                'data' => $posts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch posts',
            ], 500);
        }
    }

    /**
     * Create a new post (Doctors only)
     */
    public function createPost(Request $request)
    {
        try {
            $user = Auth::user();

            // Only doctors (role_as = 3)
            if ($user->role_as !== 3) {
                return response()->json([
                    'status' => 403,
                    'message' => 'Only doctors can create posts',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'category' => 'required|in:success_story,medical_finding,video_vlog,research_article',
                'short_description' => 'required|string|max:500',
                'content' => 'required|string',
                'video_url' => 'nullable|url',
                'visibility' => 'required|in:public,patients_only,logged_in_only',
                'publish' => 'boolean',
                'thumbnail' => 'nullable|image|max:2048',
                'pdf' => 'nullable|mimes:pdf|max:10240',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = [
                'doctor_id' => $user->id,
                'title' => $request->title,
                'category' => $request->category,
                'short_description' => $request->short_description,
                'content' => $request->content,
                'video_url' => $request->video_url,
                'visibility' => $request->visibility,
                'status' => $request->publish ? 'published' : 'draft',
                'published_at' => $request->publish ? now() : null,
            ];

            // Handle thumbnail upload
            if ($request->hasFile('thumbnail')) {
                $path = $request->file('thumbnail')->store('medical-insights/thumbnails', 'public');
                $data['thumbnail_path'] = $path;
            }

            // Handle PDF upload
            if ($request->hasFile('pdf')) {
                $path = $request->file('pdf')->store('medical-insights/pdfs', 'public');
                $data['pdf_file_path'] = $path;
            }

            $post = MedicalPost::create($data);

            // Log
            MedicalInsightsAuditLog::log($user, 'create_post', 'post', $post->id, null, $data);

            return response()->json([
                'status' => 201,
                'message' => 'Post created successfully',
                'data' => $post,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create post',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a post (Doctor can only edit own posts)
     */
    public function updatePost(Request $request, $postId)
    {
        try {
            $user = Auth::user();
            $post = MedicalPost::findOrFail($postId);

            // Only the post author can edit
            if ($post->doctor_id !== $user->id) {
                return response()->json([
                    'status' => 403,
                    'message' => 'You can only edit your own posts',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'category' => 'sometimes|in:success_story,medical_finding,video_vlog,research_article',
                'short_description' => 'sometimes|string|max:500',
                'content' => 'sometimes|string',
                'video_url' => 'nullable|url',
                'visibility' => 'sometimes|in:public,patients_only,logged_in_only',
                'status' => 'sometimes|in:draft,published',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $oldValues = $post->toArray();
            
            $post->update($request->only([
                'title', 'category', 'short_description', 'content', 
                'video_url', 'visibility', 'status'
            ]));

            // Set published_at if publishing
            if ($request->status === 'published' && !$post->published_at) {
                $post->update(['published_at' => now()]);
            }

            // Log
            MedicalInsightsAuditLog::log($user, 'edit_post', 'post', $post->id, $oldValues, $post->toArray());

            return response()->json([
                'status' => 200,
                'message' => 'Post updated successfully',
                'data' => $post,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update post',
            ], 500);
        }
    }

    /**
     * Answer a patient question (Doctor)
     */
    public function answerQuestion(Request $request, $questionId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'answer' => 'required|string|max:2000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $question = PostQuestion::with('post')->findOrFail($questionId);

            // Only the post author doctor can answer
            if ($question->post->doctor_id !== $user->id) {
                return response()->json([
                    'status' => 403,
                    'message' => 'Only the post author can answer questions',
                ], 403);
            }

            $question->update([
                'answer' => $request->answer,
                'answered_by' => $user->id,
                'answered_at' => now(),
                'status' => 'answered',
            ]);

            // Log
            MedicalInsightsAuditLog::log($user, 'answer_question', 'question', $question->id, null, [
                'answer' => $request->answer,
            ]);

            // Notify patient
            Notification::create([
                'user_id' => $question->patient_id,
                'type' => 'question_answered',
                'title' => 'Your Question Was Answered',
                'message' => "Dr. {$user->name} answered your question on \"{$question->post->title}\"",
                'link' => "/medical-insights/{$question->post->slug}",
                'is_read' => false,
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Answer submitted successfully',
                'data' => $question->fresh()->load('answeredBy:id,name,specialization'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to submit answer',
            ], 500);
        }
    }

    /**
     * Get pending questions for doctor
     */
    public function getPendingQuestions(Request $request)
    {
        try {
            $user = Auth::user();

            // Only doctors (role_as = 3)
            if ($user->role_as !== 3) {
                return response()->json([
                    'status' => 403,
                    'message' => 'Access denied',
                ], 403);
            }

            $questions = PostQuestion::whereHas('post', function ($q) use ($user) {
                    $q->where('doctor_id', $user->id);
                })
                ->pending()
                ->with(['patient:id,name,profile_picture', 'post:id,title,slug'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            return response()->json([
                'status' => 200,
                'data' => $questions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch questions',
            ], 500);
        }
    }

    // ============================================
    // ADMIN/MODERATION ENDPOINTS
    // ============================================

    /**
     * Hide a post (Admin only)
     */
    public function hidePost(Request $request, $postId)
    {
        try {
            $user = Auth::user();

            // Only admins
            if (!in_array($user->role_as, [1, 2])) {
                return response()->json([
                    'status' => 403,
                    'message' => 'Access denied',
                ], 403);
            }

            $post = MedicalPost::findOrFail($postId);

            $post->update([
                'status' => 'hidden',
                'moderated_by' => $user->id,
                'moderated_at' => now(),
                'moderation_reason' => $request->reason,
            ]);

            // Log
            MedicalInsightsAuditLog::log($user, 'hide_post', 'post', $post->id, null, [
                'reason' => $request->reason,
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Post hidden successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to hide post',
            ], 500);
        }
    }

    /**
     * Hide a comment (Admin only)
     */
    public function hideComment(Request $request, $commentId)
    {
        try {
            $user = Auth::user();

            if (!in_array($user->role_as, [1, 2])) {
                return response()->json([
                    'status' => 403,
                    'message' => 'Access denied',
                ], 403);
            }

            $comment = PostComment::findOrFail($commentId);

            $comment->update([
                'status' => 'hidden',
                'moderated_by' => $user->id,
                'moderated_at' => now(),
                'moderation_reason' => $request->reason,
            ]);

            $comment->post->updateCommentCount();

            // Log
            MedicalInsightsAuditLog::log($user, 'hide_comment', 'comment', $comment->id, null, [
                'reason' => $request->reason,
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Comment hidden successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to hide comment',
            ], 500);
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private function recordView(MedicalPost $post, $user, Request $request)
    {
        // Check if already viewed in last 24 hours
        $existingView = PostView::where('post_id', $post->id)
            ->where(function ($q) use ($user, $request) {
                if ($user) {
                    $q->where('user_id', $user->id);
                } else {
                    $q->where('ip_address', $request->ip());
                }
            })
            ->where('created_at', '>=', now()->subDay())
            ->exists();

        if (!$existingView) {
            PostView::create([
                'post_id' => $post->id,
                'user_id' => $user?->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            $post->incrementViewCount();
        }
    }
}
