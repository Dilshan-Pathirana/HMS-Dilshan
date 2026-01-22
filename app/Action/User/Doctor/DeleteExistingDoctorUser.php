<?php

namespace App\Action\User\Doctor;

use App\Models\AllUsers\User;
use App\Models\AllUsers\Doctor;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;

class DeleteExistingDoctorUser
{
    public function __invoke(string $userId):array
    {
        try {
            $doctorUser = User::findOrFail($userId);
            if (! $doctorUser) {
                return CommonResponse::sendBadResponseWithMessage('User id is not existing');
            }
            if ($doctorUser) {
                $doctorDetails = Doctor::where('user_id', $doctorUser->id)->first();
            }
            if ($doctorUser->role_as !== 3) {
                return CommonResponse::sendBadResponseWithMessage('Branch id is not existing');
            }
            $doctorUser->delete();
            $doctorDetails->delete();

            return CommonResponse::sendSuccessResponse('Doctor deleted successfully');
        } catch (\Exception $exception) {
            Log::error('DeleteExistingDoctorUser Error: '.$exception->getMessage());

            return CommonResponse::sendBadResponseWithMessage('User id is not existing');
        }
    }
}
