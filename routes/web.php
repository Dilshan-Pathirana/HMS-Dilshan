<?php

use Illuminate\Support\Facades\Route;

// Serve frontend SPA via Blade so asset tags are generated from the Vite manifest
Route::get('/', function () {
    return view('spa');
});

// Fallback for SPA client-side routes
// Note: This should NOT be triggered for /api/* routes since they are handled by api.php
Route::fallback(function (\Illuminate\Http\Request $request) {
    // Log if an API route hits the fallback (shouldn't happen)
    if (str_starts_with($request->path(), 'api/')) {
        \Illuminate\Support\Facades\Log::error('API route hit web fallback: ' . $request->path());
        return response()->json(['error' => 'Route not found', 'path' => $request->path()], 404);
    }
    return view('spa');
});
