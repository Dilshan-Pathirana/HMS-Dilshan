<?php

namespace App\Presentation\Api\Controllers;

use App\Application\Services\AuthenticationService;
use App\Application\DTOs\AuthenticationDTO;
use Illuminate\Http\Request;

/**
 * Authentication Controller
 * Handles authentication-related endpoints
 */
class AuthenticationController extends ApiController
{
    public function __construct(private AuthenticationService $authService)
    {
    }

    /**
     * Login endpoint
     * POST /api/auth/login
     */
    public function login(Request $request)
    {
        try {
            $credentials = new AuthenticationDTO(
                $request->input('email'),
                $request->input('password'),
                $request->input('mfa_code')
            );

            $result = $this->authService->authenticate($credentials);

            if ($result['requires_mfa']) {
                return $this->success(
                    ['mfa_token' => $result['mfa_token']],
                    'MFA code sent',
                    null,
                    202
                );
            }

            return $this->success($result, 'Login successful');

        } catch (\Throwable $e) {
            return $this->handleAuthException($e);
        }
    }

    /**
     * Logout endpoint
     * POST /api/auth/logout
     */
    public function logout(Request $request)
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                return $this->unauthorized('No token provided');
            }

            $this->authService->logout($token);

            return $this->success(null, 'Logout successful');

        } catch (\Throwable $e) {
            return $this->handleAuthException($e);
        }
    }

    /**
     * Validate token endpoint
     * GET /api/auth/validate
     */
    public function validateToken(Request $request)
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                return $this->unauthorized('No token provided');
            }

            $decoded = $this->authService->validateToken($token);

            return $this->success([
                'valid' => true,
                'expires_at' => date('Y-m-d H:i:s', $decoded->exp),
                'user_id' => $decoded->sub,
            ], 'Token is valid');

        } catch (\Throwable $e) {
            return $this->handleAuthException($e);
        }
    }

    /**
     * Handle authentication exceptions
     */
    private function handleAuthException(\Throwable $e)
    {
        if ($e instanceof \App\Core\Exceptions\AuthenticationException) {
            return $this->unauthorized($e->getMessage());
        }

        return $this->serverError($e->getMessage());
    }
}
