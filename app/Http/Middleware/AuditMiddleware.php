<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ChangeLog;

class AuditMiddleware
{
    /**
     * Log all state-changing operations
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log authenticated requests that modify data
        if ($request->user() && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $this->logChange($request, $response);
        }

        return $response;
    }

    private function logChange(Request $request, Response $response): void
    {
        // Don't log failed requests or non-JSON responses
        $contentType = $response->headers->get('Content-Type', '');
        if ($response->getStatusCode() >= 400 || !str_contains($contentType, 'json')) {
            return;
        }

        try {
            $content = json_decode($response->getContent(), true);
            
            // Extract entity information from response or route
            $entityType = $this->getEntityType($request);
            $entityId = $content['id'] ?? $this->getEntityId($request);

            if (!$entityType || !$entityId) {
                return;
            }

            $action = $this->getAction($request->method());

            ChangeLog::create([
                'user_id' => $request->user()->id,
                'center_id' => $request->user()->center_id,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'action' => $action,
                'before_data' => $action === 'update' ? $request->input('_original', []) : null,
                'after_data' => $action !== 'delete' ? $content : null,
                'changes' => $action === 'update' ? $this->getChanges($request) : null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        } catch (\Exception $e) {
            // Silently fail - don't break the request
            \Log::error('Audit logging failed: ' . $e->getMessage());
        }
    }

    private function getEntityType(Request $request): ?string
    {
        $path = $request->path();
        
        // Extract entity from URL pattern
        $patterns = [
            'patients' => 'Patient',
            'appointments' => 'Appointment',
            'sessions' => 'Session',
            'medications' => 'Medication',
            'invoices' => 'Invoice',
            'payments' => 'Payment',
            'payroll' => 'Payroll',
        ];

        foreach ($patterns as $pattern => $entity) {
            if (str_contains($path, $pattern)) {
                return $entity;
            }
        }

        return null;
    }

    private function getEntityId(Request $request): ?int
    {
        // Try to extract ID from route parameters
        $segments = $request->segments();
        foreach ($segments as $segment) {
            if (is_numeric($segment)) {
                return (int) $segment;
            }
        }

        return null;
    }

    private function getAction(string $method): string
    {
        return match($method) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'unknown',
        };
    }

    private function getChanges(Request $request): array
    {
        $changes = [];
        $original = $request->input('_original', []);
        $new = $request->except(['_original', '_token', '_method']);

        foreach ($new as $key => $value) {
            if (!isset($original[$key]) || $original[$key] != $value) {
                $changes[$key] = [
                    'old' => $original[$key] ?? null,
                    'new' => $value,
                ];
            }
        }

        return $changes;
    }
}
