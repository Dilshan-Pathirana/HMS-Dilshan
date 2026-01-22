<?php

namespace App\Core\Exceptions;

/**
 * Exception thrown when a requested resource is not found
 */
class ResourceNotFoundException extends DomainException
{
    protected int $statusCode = 404;
    protected string $errorType = 'not_found';

    public function __construct(string $resourceName = 'Resource', string $identifier = '')
    {
        $message = "The {$resourceName}";
        if ($identifier) {
            $message .= " with identifier '{$identifier}'";
        }
        $message .= " could not be found.";

        parent::__construct($message, 404, 'not_found');
    }
}
