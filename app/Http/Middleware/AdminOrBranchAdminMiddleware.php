<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOrBranchAdminMiddleware
{
    /**
     * Handle an incoming request.
     * Allows both Super Admin (role_as = 1) and Branch Admin (role_as = 2) to access.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            // Check for Super Admin
            if (auth()->user()->tokenCan('server:super-admin')) {
                return $next($request);
            }
            
            // Check for Branch Admin
            if (auth()->user()->tokenCan('server:admin')) {
                return $next($request);
            }
        }

        return response()->json([
            'status' => Response::HTTP_UNAUTHORIZED,
            'message' => 'Unauthorized. Admin access required.',
        ], Response::HTTP_UNAUTHORIZED);
    }
}
