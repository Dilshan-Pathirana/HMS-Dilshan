<?php

namespace App\Presentation\Api\Controllers;

use App\Presentation\Api\Responses\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * Base API controller
 */
class ApiController extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Return success response
     */
    protected function success(mixed $data = null, string $message = 'Success', ?array $meta = null, int $statusCode = 200)
    {
        return response()->json(
            ApiResponse::success($data, $message, $meta, $statusCode)->toArray(),
            $statusCode
        );
    }

    /**
     * Return created response
     */
    protected function created(mixed $data = null, string $message = 'Resource created successfully')
    {
        return response()->json(
            ApiResponse::created($data, $message)->toArray(),
            201
        );
    }

    /**
     * Return error response
     */
    protected function error(string $message, ?array $errors = null, int $statusCode = 400)
    {
        return response()->json(
            ApiResponse::error($message, $errors, $statusCode)->toArray(),
            $statusCode
        );
    }

    /**
     * Return validation error response
     */
    protected function validationError(array $errors, string $message = 'Validation failed')
    {
        return response()->json(
            ApiResponse::validationError($errors, $message)->toArray(),
            422
        );
    }

    /**
     * Return unauthorized response
     */
    protected function unauthorized(string $message = 'Unauthorized')
    {
        return response()->json(
            ApiResponse::unauthorized($message)->toArray(),
            401
        );
    }

    /**
     * Return forbidden response
     */
    protected function forbidden(string $message = 'Forbidden')
    {
        return response()->json(
            ApiResponse::forbidden($message)->toArray(),
            403
        );
    }

    /**
     * Return not found response
     */
    protected function notFound(string $message = 'Resource not found')
    {
        return response()->json(
            ApiResponse::notFound($message)->toArray(),
            404
        );
    }

    /**
     * Return server error response
     */
    protected function serverError(string $message = 'Internal server error')
    {
        return response()->json(
            ApiResponse::serverError($message)->toArray(),
            500
        );
    }
}
