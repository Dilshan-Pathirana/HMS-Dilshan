<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PatientUserMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check() && auth()->user()->tokenCan('server:patient')) {
            return $next($request);
        }

        return response()->json([
            'status' => Response::HTTP_UNAUTHORIZED,
            'message' => Response::$statusTexts[401],
        ]);
    }
}
