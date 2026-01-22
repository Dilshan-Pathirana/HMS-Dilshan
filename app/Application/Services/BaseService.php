<?php

namespace App\Application\Services;

use App\Core\Exceptions\DomainException;
use Illuminate\Support\Facades\Log;

/**
 * Base service class
 * Provides common functionality for all application services
 */
abstract class BaseService
{
    /**
     * Log operation
     */
    protected function log(string $level, string $message, array $context = []): void
    {
        Log::$level($message, $context);
    }

    /**
     * Handle exception
     */
    protected function handleException(\Throwable $exception): void
    {
        $this->log('error', $exception->getMessage(), [
            'exception' => get_class($exception),
            'trace' => $exception->getTraceAsString(),
        ]);

        if ($exception instanceof DomainException) {
            throw $exception;
        }

        throw new DomainException(
            'An unexpected error occurred',
            500,
            'server_error'
        );
    }

    /**
     * Validate required fields
     */
    protected function validateRequired(array $data, array $requiredFields): void
    {
        $missing = [];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }

        if (!empty($missing)) {
            throw new DomainException(
                'Missing required fields: ' . implode(', ', $missing),
                422,
                'validation_error'
            );
        }
    }

    /**
     * Dispatch domain event
     */
    protected function dispatchDomainEvent(object $event): void
    {
        event($event);
    }
}
