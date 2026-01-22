<?php

use App\Http\Middleware\AdminCheckMiddleware;
use App\Http\Middleware\SuperAdminCheckMiddleware;
use App\Http\Middleware\BranchIsolationMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        
        // Add CORS middleware at the beginning
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);
        
        // Exclude authentication and webhook endpoints from CSRF protection
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Register custom middleware
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'check.center' => \App\Http\Middleware\CheckMedicalCenter::class,
            'audit' => \App\Http\Middleware\AuditMiddleware::class,
            'sanitize' => \App\Http\Middleware\SanitizeInput::class,
            'branch.isolation' => \App\Http\Middleware\BranchIsolationMiddleware::class,
        ]);

        // Apply global middleware
        $middleware->append(\App\Http\Middleware\SanitizeInput::class);

        // API rate limiting
        $middleware->api(prepend: [
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Return JSON for unauthenticated API requests instead of redirecting
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'status' => 401,
                    'message' => 'Unauthenticated. Please login again.',
                ], 401);
            }
        });
    })->create();
