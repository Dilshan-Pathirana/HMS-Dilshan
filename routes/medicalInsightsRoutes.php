<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MedicalInsights\MedicalInsightsController;

/*
|--------------------------------------------------------------------------
| Medical Insights API Routes
|--------------------------------------------------------------------------
|
| Routes for the Medical Blog & Knowledge Sharing Platform
|
*/

// Public routes - accessible to everyone
Route::prefix('medical-insights')->group(function () {
    // Get all published posts with filters
    Route::get('/posts', [MedicalInsightsController::class, 'getPosts']);
    
    // Get categories list
    Route::get('/categories', [MedicalInsightsController::class, 'getCategories']);
    
    // Get single post by slug
    Route::get('/posts/{slug}', [MedicalInsightsController::class, 'getPost']);
});

// Authenticated routes - for logged in users
Route::middleware('auth:sanctum')->prefix('medical-insights')->group(function () {
    // Like/unlike a post
    Route::post('/posts/{postId}/like', [MedicalInsightsController::class, 'toggleLike']);
    
    // Rate a post
    Route::post('/posts/{postId}/rate', [MedicalInsightsController::class, 'ratePost']);
    
    // Add comment to a post
    Route::post('/posts/{postId}/comments', [MedicalInsightsController::class, 'addComment']);
    
    // Ask a question on a post
    Route::post('/posts/{postId}/questions', [MedicalInsightsController::class, 'askQuestion']);
});

// Doctor routes - for doctors only (role_as = 6)
Route::middleware(['auth:sanctum'])->prefix('medical-insights/doctor')->group(function () {
    // Get doctor's own posts
    Route::get('/posts', [MedicalInsightsController::class, 'getDoctorPosts']);
    
    // Create new post
    Route::post('/posts', [MedicalInsightsController::class, 'createPost']);
    
    // Update existing post
    Route::put('/posts/{postId}', [MedicalInsightsController::class, 'updatePost']);
    
    // Delete own post (soft delete - changes status to deleted)
    Route::delete('/posts/{postId}', [MedicalInsightsController::class, 'deletePost']);
    
    // Get pending questions for doctor's posts
    Route::get('/questions/pending', [MedicalInsightsController::class, 'getPendingQuestions']);
    
    // Answer a question
    Route::post('/questions/{questionId}/answer', [MedicalInsightsController::class, 'answerQuestion']);
});

// Admin moderation routes - for admins only (role_as = 1, 2)
Route::middleware(['auth:sanctum'])->prefix('medical-insights/admin')->group(function () {
    // Hide/unhide a post
    Route::post('/posts/{postId}/toggle-visibility', [MedicalInsightsController::class, 'hidePost']);
    
    // Hide/unhide a comment
    Route::post('/comments/{commentId}/toggle-visibility', [MedicalInsightsController::class, 'hideComment']);
    
    // Get all posts for moderation
    Route::get('/posts', [MedicalInsightsController::class, 'getAllPostsForModeration']);
    
    // Get flagged content
    Route::get('/flagged', [MedicalInsightsController::class, 'getFlaggedContent']);
});
