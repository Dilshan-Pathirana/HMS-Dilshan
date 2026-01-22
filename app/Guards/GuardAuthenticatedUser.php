<?php

namespace App\Guards;

use App\Models\AllUsers\User;
use App\Models\AllUsers\Patient;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Hash;
use App\Response\AuthenticationResponse;

class GuardAuthenticatedUser
{
    public function __invoke(array $validatedUserSignInRequest): array
    {
        $identifier = $validatedUserSignInRequest['email'];

        if ($this->isEmail($identifier)) {
            return $this->authenticateViaEmail($identifier, $validatedUserSignInRequest);
        }

        return $this->authenticateViaPhone($identifier, $validatedUserSignInRequest);
    }

    private function isEmail(string $identifier): bool
    {
        return filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false;
    }

    private function authenticateViaEmail(string $email, array $request): array
    {
        $user = User::where('email', $email)->first();

        if (! $user) {
            return AuthenticationResponse::sendUserNotFoundResponse();
        }

        if ($this->isUserValid($user, $request)) {
            return AuthenticationResponse::sendUserSendAuthenticatedResponse($user);
        }

        return AuthenticationResponse::sendUserUnauthenticatedResponse();
    }

    private function authenticateViaPhone(string $phone, array $request): array
    {
        $patient = Patient::where('phone', $phone)->first();

        if (is_null($patient)) {
            return CommonResponse::sendBadResponseWithMessage('Patient not found for the given phone number.');
        }

        $user = User::find($patient->user_id);

        if (is_null($user)) {
            return CommonResponse::sendBadResponseWithMessage('User not found for the patient.');
        }

        if ($this->isUserValid($user, $request)) {
            return AuthenticationResponse::sendUserSendAuthenticatedResponse($user);
        }

        return AuthenticationResponse::sendUserUnauthenticatedResponse();
    }

    private function isUserValid($user, array $request): bool
    {
        return Hash::check($request['password'], $user->password);
    }
}
