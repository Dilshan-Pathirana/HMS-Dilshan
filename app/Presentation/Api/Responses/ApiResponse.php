<?php

namespace App\Presentation\Api\Responses;

/**
 * Standard API response formatter
 */
class ApiResponse
{
    private int $statusCode;
    private string $message;
    private mixed $data;
    private ?array $errors = null;
    private ?array $meta = null;

    public function __construct(
        int $statusCode,
        string $message,
        mixed $data = null,
        ?array $errors = null,
        ?array $meta = null
    ) {
        $this->statusCode = $statusCode;
        $this->message = $message;
        $this->data = $data;
        $this->errors = $errors;
        $this->meta = $meta;
    }

    public static function success(mixed $data = null, string $message = 'Success', ?array $meta = null, int $statusCode = 200): self
    {
        return new self($statusCode, $message, $data, null, $meta);
    }

    public static function created(mixed $data = null, string $message = 'Resource created successfully'): self
    {
        return new self(201, $message, $data);
    }

    public static function error(string $message, ?array $errors = null, int $statusCode = 400): self
    {
        return new self($statusCode, $message, null, $errors);
    }

    public static function unauthorized(string $message = 'Unauthorized'): self
    {
        return new self(401, $message);
    }

    public static function forbidden(string $message = 'Forbidden'): self
    {
        return new self(403, $message);
    }

    public static function notFound(string $message = 'Resource not found'): self
    {
        return new self(404, $message);
    }

    public static function validationError(array $errors, string $message = 'Validation failed'): self
    {
        return new self(422, $message, null, $errors);
    }

    public static function serverError(string $message = 'Internal server error'): self
    {
        return new self(500, $message);
    }

    public function toArray(): array
    {
        $response = [
            'success' => $this->statusCode >= 200 && $this->statusCode < 300,
            'status_code' => $this->statusCode,
            'message' => $this->message,
        ];

        if ($this->data !== null) {
            $response['data'] = $this->data;
        }

        if ($this->errors !== null) {
            $response['errors'] = $this->errors;
        }

        if ($this->meta !== null) {
            $response['meta'] = $this->meta;
        }

        return $response;
    }

    public function toJson(): string
    {
        return json_encode($this->toArray());
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
