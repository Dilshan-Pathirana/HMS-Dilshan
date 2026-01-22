<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PharmacistUserMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if authenticated and either has pharmacist token ability OR has pharmacist role
        if (auth()->check()) {
            $user = auth()->user();
            if ($user->tokenCan('server:pharmacist') || $user->role_as == 7) {
                return $next($request);
            }
        }

        return response()->json([
            'status' => Response::HTTP_UNAUTHORIZED,
            'message' => Response::$statusTexts[401],
        ]);
    }
}
