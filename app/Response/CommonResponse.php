<?php

namespace App\Response;

use Symfony\Component\HttpFoundation\Response;

class CommonResponse
{
    public static function sendSuccessResponse(string $message): array
    {
        return [
            'status' => Response::HTTP_OK,
            'message' => $message,
        ];
    }

    public static function sendBadResponse(): array
    {
        return [
            'status' => Response::HTTP_INTERNAL_SERVER_ERROR,
            'message' => Response::$statusTexts[500],
        ];
    }

    public static function sendBadResponseWithMessage(string $message): array
    {
        return [
            'status' => Response::HTTP_INTERNAL_SERVER_ERROR,
            'message' => $message,
        ];
    }

    public static function sendSuccessResponseWithData(string $type, object $data): array
    {
        return [
            'status' => Response::HTTP_OK,
            $type => $data,
        ];
    }

    public static function sendBadRequestResponse(string $responseType): array
    {
        return [
            'status' => Response::HTTP_BAD_REQUEST,
            'message' => "Invalid $responseType Id",
        ];
    }

    public static function getNotFoundResponse(string $responseType): array
    {
        return [
            'status' => Response::HTTP_NOT_FOUND,
            $responseType => [],
        ];
    }
}
