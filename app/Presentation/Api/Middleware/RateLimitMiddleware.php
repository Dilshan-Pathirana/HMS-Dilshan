<?php

namespace App\Presentation\Api\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiter;

/**
 * Rate limiting middleware
 */
class RateLimitMiddleware
{
    protected RateLimiter $limiter;

    public function __construct(RateLimiter $limiter)
    {
        $this->limiter = $limiter;
    }

    public function handle(Request $request, Closure $next, string $limit = '60:1')
    {
        $key = $this->resolveRequestSignature($request);
        $maxAttempts = (int) explode(':', $limit)[0];
        $decayMinutes = (int) explode(':', $limit)[1];

        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            return response()->json([
                'success' => false,
                'message' => 'Rate limit exceeded',
                'retry_after' => $this->limiter->availableIn($key),
            ], 429);
        }

        $this->limiter->hit($key, $decayMinutes * 60);

        return $next($request);
    }

    protected function resolveRequestSignature(Request $request): string
    {
        return sha1(
            $request->method() .
            '|' . $request->getHost() .
            '|' . ($request->user()?->id ?? $request->ip())
        );
    }
}
