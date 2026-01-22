<?php

namespace App\Presentation\Api\Middleware;

use App\Core\Exceptions\AuthorizationException;
use Closure;
use Illuminate\Http\Request;

/**
 * Role-Based Access Control Middleware
 */
class RbacMiddleware
{
    public function handle(Request $request, Closure $next, string $requiredRole)
    {
        $userRole = $request->attributes->get('userRole');

        if ($userRole === 'super_admin') {
            return $next($request);
        }

        $roles = explode('|', $requiredRole);

        if (!in_array($userRole, $roles)) {
            throw new AuthorizationException(
                "Your role '$userRole' is not authorized to access this resource"
            );
        }

        return $next($request);
    }
}
