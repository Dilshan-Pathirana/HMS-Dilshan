<?php

namespace App\Response;

use App\Models\AllUsers\User;
use Symfony\Component\HttpFoundation\Response;
use App\Services\AuthenticatedUserTokenGenerator;

class AuthenticationResponse
{
    public static function sendUserNotFoundResponse(): array
    {
        return [
            'status' => Response::HTTP_UNAUTHORIZED,
            'message' => 'User not found! Please check your email',
        ];
    }

    public static function sendUserUnauthenticatedResponse(): array
    {
        return [
            'status' => Response::HTTP_UNAUTHORIZED,
            'message' => 'Unauthorized! Please check your password',
        ];
    }

    public static function sendUserSendAuthenticatedResponse(User $user): array
    {
        // Load branch relationship if user has one
        $branch = null;
        if ($user->branch_id) {
            $branch = \App\Models\Branch::find($user->branch_id);
        }

        return [
            'userId' => $user->id,
            'token' => AuthenticatedUserTokenGenerator::getValidToken($user),
            'userRole' => $user->role_as,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'gender' => $user->gender,
                'date_of_birth' => $user->date_of_birth,
                'address' => $user->address,
                'profile_picture' => $user->profile_picture,
                'role_as' => $user->role_as,
                'user_type' => $user->user_type,
                'branch_id' => $user->branch_id,
                'branch_name' => $branch?->center_name ?? null,
                'branch_logo' => $branch?->logo ?? null,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ];
    }
}
