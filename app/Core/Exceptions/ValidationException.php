<?php

namespace App\Core\Exceptions;

/**
 * Validation exception for domain layer
 */
class ValidationException extends DomainException
{
    protected int $statusCode = 422;
    protected string $errorType = 'validation_error';

    public function __construct(string $message = 'Validation failed', array $errors = [])
    {
        parent::__construct($message, 422, 'validation_error');
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors ?? [];
    }
}
