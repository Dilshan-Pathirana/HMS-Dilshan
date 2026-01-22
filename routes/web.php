<?php

use Illuminate\Support\Facades\Route;

// Serve frontend SPA
Route::get('/', function () {
    return file_get_contents(public_path('index.html'));
});

// Fallback for SPA client-side routes
// Note: This should NOT be triggered for /api/* routes since they are handled by api.php
Route::fallback(function (\Illuminate\Http\Request $request) {
    // Log if an API route hits the fallback (shouldn't happen)
    if (str_starts_with($request->path(), 'api/')) {
        \Illuminate\Support\Facades\Log::error('API route hit web fallback: ' . $request->path());
        return response()->json(['error' => 'Route not found', 'path' => $request->path()], 404);
    }
    return file_get_contents(public_path('index.html'));
});
