<?php

namespace App\Core\Exceptions;

use Exception;

/**
 * Base exception for domain layer
 * All domain-related exceptions should extend this class
 */
class DomainException extends Exception
{
    protected int $statusCode = 400;
    protected string $errorType = 'domain_error';

    public function __construct(string $message = '', int $statusCode = 400, string $errorType = 'domain_error')
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->errorType = $errorType;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getErrorType(): string
    {
        return $this->errorType;
    }
}
