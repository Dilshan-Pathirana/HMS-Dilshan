<?php

namespace App\Application\Services;

use App\Core\Exceptions\AuthenticationException;
use App\Core\Exceptions\ValidationException;
use App\Domain\ValueObjects\Email;
use App\Domain\ValueObjects\PhoneNumber;
use App\Application\DTOs\AuthenticationDTO;
use Illuminate\Support\Facades\Hash;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\DB;

/**
 * Authentication Service
 * Handles user authentication, token generation, and MFA
 */
class AuthenticationService extends BaseService
{
    private string $jwtSecret;
    private int $tokenExpiration = 3600; // 1 hour

    public function __construct()
    {
        $this->jwtSecret = config('app.jwt_secret', env('JWT_SECRET', 'your-secret-key'));
    }

    /**
     * Authenticate user and generate JWT token
     */
    public function authenticate(AuthenticationDTO $credentials): array
    {
        try {
            // Find user by email
            $user = DB::table('users')
                ->where('email', $credentials->email)
                ->where('is_active', true)
                ->first();

            if (!$user) {
                throw new AuthenticationException('Invalid email or password');
            }

            // Verify password
            if (!Hash::check($credentials->password, $user->password)) {
                // Log failed attempt
                $this->log('warning', 'Failed authentication attempt', [
                    'email' => $credentials->email,
                    'ip' => request()->ip(),
                ]);

                throw new AuthenticationException('Invalid email or password');
            }

            // Check if MFA is enabled
            if ($user->mfa_enabled && !$credentials->mfaCode) {
                return [
                    'requires_mfa' => true,
                    'mfa_token' => $this->generateMfaToken($user->id),
                ];
            }

            // If MFA code provided, verify it
            if ($user->mfa_enabled && $credentials->mfaCode) {
                $this->verifyMfaCode($user->id, $credentials->mfaCode);
            }

            // Generate JWT token
            $token = $this->generateToken($user);

            $this->log('info', 'User authenticated successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            return [
                'requires_mfa' => false,
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'role' => $user->role,
                    'center_id' => $user->center_id,
                ],
            ];

        } catch (AuthenticationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Generate JWT token for user
     */
    private function generateToken(object $user): string
    {
        $issuedAt = time();
        $expire = $issuedAt + $this->tokenExpiration;

        $payload = [
            'iss' => config('app.url'),
            'aud' => config('app.url'),
            'iat' => $issuedAt,
            'exp' => $expire,
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'center_id' => $user->center_id,
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    /**
     * Generate MFA token for temporary storage
     */
    private function generateMfaToken(int $userId): string
    {
        $token = bin2hex(random_bytes(32));
        
        DB::table('mfa_tokens')->insert([
            'user_id' => $userId,
            'token' => $token,
            'code' => $this->generateMfaCode(),
            'expires_at' => now()->addMinutes(5),
            'created_at' => now(),
        ]);

        // TODO: Send MFA code via SMS/Email
        $this->sendMfaCode($userId);

        return $token;
    }

    /**
     * Generate random MFA code
     */
    private function generateMfaCode(): string
    {
        return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Verify MFA code
     */
    private function verifyMfaCode(int $userId, string $code): void
    {
        $mfaToken = DB::table('mfa_tokens')
            ->where('user_id', $userId)
            ->where('code', $code)
            ->where('expires_at', '>', now())
            ->where('verified_at', null)
            ->first();

        if (!$mfaToken) {
            throw new AuthenticationException('Invalid or expired MFA code');
        }

        // Mark as verified
        DB::table('mfa_tokens')
            ->where('id', $mfaToken->id)
            ->update(['verified_at' => now()]);
    }

    /**
     * Send MFA code to user
     */
    private function sendMfaCode(int $userId): void
    {
        // TODO: Implement SMS/Email sending
        $this->log('info', 'MFA code sent to user', ['user_id' => $userId]);
    }

    /**
     * Validate token
     */
    public function validateToken(string $token): object
    {
        try {
            return JWT::decode($token, new \Firebase\JWT\Key($this->jwtSecret, 'HS256'));
        } catch (\Exception $e) {
            throw new AuthenticationException('Invalid or expired token');
        }
    }

    /**
     * Logout user (blacklist token)
     */
    public function logout(string $token): void
    {
        try {
            $decoded = $this->validateToken($token);

            DB::table('blacklisted_tokens')->insert([
                'token' => hash('sha256', $token),
                'expires_at' => date('Y-m-d H:i:s', $decoded->exp),
                'created_at' => now(),
            ]);

            $this->log('info', 'User logged out', ['user_id' => $decoded->sub]);
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Check if token is blacklisted
     */
    public function isTokenBlacklisted(string $token): bool
    {
        return DB::table('blacklisted_tokens')
            ->where('token', hash('sha256', $token))
            ->exists();
    }
}
