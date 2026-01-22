<?php

namespace App\Core\Exceptions;

/**
 * Exception thrown when authentication fails
 */
class AuthenticationException extends DomainException
{
    protected int $statusCode = 401;
    protected string $errorType = 'authentication_error';

    public function __construct(string $message = 'Authentication failed')
    {
        parent::__construct($message, 401, 'authentication_error');
    }
}
