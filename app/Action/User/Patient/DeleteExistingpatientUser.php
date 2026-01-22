<?php

namespace App\Action\User\Patient;

use App\Models\AllUsers\User;
use App\Models\AllUsers\Patient;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;

class DeleteExistingpatientUser
{
    public function __invoke(string $userId):array
    {
        try {
            $patientUser = User::find($userId);
            if (! $patientUser) {
                return CommonResponse::sendBadResponseWithMessage('User id is not existing');
            }
            if ($patientUser->role_as !== 5) {
                return CommonResponse::sendBadResponseWithMessage('User is not a patient');
            }
            
            // Find and delete patient details if they exist
            $patientDetails = Patient::where('user_id', $patientUser->id)->first();
            if ($patientDetails) {
                $patientDetails->delete();
            }
            
            // Delete the user
            $patientUser->delete();

            return CommonResponse::sendSuccessResponse('Patient deleted successfully');
        } catch (\Exception $exception) {
            Log::error('DeleteExistingPatientUser Error: '.$exception->getMessage());

            return CommonResponse::sendBadResponseWithMessage($exception->getMessage());
        }
    }
}
