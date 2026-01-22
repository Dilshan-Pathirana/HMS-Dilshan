<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Sanitize all input to prevent XSS attacks
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Remove script tags and dangerous attributes
                $value = $this->sanitize($value);
            }
        });

        $request->merge($input);

        return $next($request);
    }

    private function sanitize(string $value): string
    {
        // Remove script tags
        $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);
        
        // Remove dangerous event handlers
        $value = preg_replace('/on\w+\s*=\s*["\']?[^"\']*["\']?/i', '', $value);
        
        // Remove javascript: protocol
        $value = preg_replace('/javascript:/i', '', $value);
        
        // Strip PHP tags
        $value = strip_tags($value);
        
        return $value;
    }
}
