<?php

namespace App\Action\User\Patient;

use App\Services\SmsSender;
use App\Models\AllUsers\User;
use App\Models\AllUsers\Patient;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Services\AuthenticatedUserTokenGenerator;

class CreatePatientUserNewPassword
{
    public function __invoke(array $forgotPasswordResetDetails): array
    {
        try {
            $patientPhoneNumber = $forgotPasswordResetDetails['phone'];

            $patient = Patient::where('phone', $patientPhoneNumber)->first();

            if (is_null($patient)) {
                return CommonResponse::sendBadResponseWithMessage('Patient not found for the given phone number.');
            }

            $user = User::find($patient->user_id);

            if (is_null($user)) {
                return CommonResponse::sendBadResponseWithMessage('User not found for the patient.');
            }

            $newPassword = AuthenticatedUserTokenGenerator::getPassword();
            $user->password = Hash::make($newPassword);
            $user->save();

            $smsSent = SmsSender::sendSMS(
                $patient->phone, 
                'Your login credential is '.PHP_EOL.' user name: '.$patient->phone.PHP_EOL.' password: '.$newPassword
            );

            if (!$smsSent) {
                Log::warning('SMS could not be sent for password reset to: ' . $patient->phone);
            }

            return CommonResponse::sendSuccessResponse('New password has been sent to your phone number. Please check your message inbox.');
        } catch (\Exception $e) {
            Log::error('Error in CreatePatientUserNewPassword: ' . $e->getMessage());
            return CommonResponse::sendBadResponseWithMessage('An error occurred while resetting your password. Please try again.');
        }
    }
}
