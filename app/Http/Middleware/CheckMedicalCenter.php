<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMedicalCenter
{
    /**
     * Ensure user belongs to the medical center they're accessing
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Super admin can access any center
        if ($request->user()->role === 'super_admin') {
            return $next($request);
        }

        // Check if user has a center_id
        if (!$request->user()->center_id) {
            return response()->json([
                'message' => 'User not associated with any medical center'
            ], 403);
        }

        // Validate center_id in request matches user's center
        if ($request->has('center_id') && $request->center_id != $request->user()->center_id) {
            return response()->json([
                'message' => 'Unauthorized access to different medical center'
            ], 403);
        }

        return $next($request);
    }
}
