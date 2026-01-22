<?php

namespace App\Core\Exceptions;

/**
 * Exception thrown when user is not authorized to perform action
 */
class AuthorizationException extends DomainException
{
    protected int $statusCode = 403;
    protected string $errorType = 'authorization_error';

    public function __construct(string $message = 'You are not authorized to perform this action')
    {
        parent::__construct($message, 403, 'authorization_error');
    }
}
