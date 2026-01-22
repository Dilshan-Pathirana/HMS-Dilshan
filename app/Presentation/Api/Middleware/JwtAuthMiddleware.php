<?php

namespace App\Presentation\Api\Middleware;

use App\Core\Exceptions\AuthenticationException;
use Closure;
use Illuminate\Http\Request;

/**
 * JWT Token Authentication Middleware
 */
class JwtAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            throw new AuthenticationException('Authorization token is missing');
        }

        try {
            // Verify token with JWT library
            $decoded = \Firebase\JWT\JWT::decode(
                $token,
                new \Firebase\JWT\Key(config('app.jwt_secret'), 'HS256')
            );

            // Attach user to request
            $request->attributes->set('user', $decoded);
            $request->attributes->set('userId', $decoded->sub);
            $request->attributes->set('userRole', $decoded->role);

        } catch (\Exception $e) {
            throw new AuthenticationException('Invalid or expired token');
        }

        return $next($request);
    }
}
