<?php

namespace App\Core\Exceptions;

/**
 * Exception thrown when business logic constraints are violated
 */
class BusinessLogicException extends DomainException
{
    protected int $statusCode = 422;
    protected string $errorType = 'business_logic_error';

    public function __construct(string $message = 'Business logic constraint violated')
    {
        parent::__construct($message, 422, 'business_logic_error');
    }
}
