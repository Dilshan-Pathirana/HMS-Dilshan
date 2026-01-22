<?php

namespace App\Action\User\Pharmacist;

use App\Models\AllUsers\User;
use App\Response\CommonResponse;
use App\Models\AllUsers\Pharmacist;
use Illuminate\Support\Facades\Log;

class DeleteExistingPharmacistUser
{
    public function __invoke(string $userId): array
    {
        try {
            $pharmacistUser = User::findOrFail($userId);
            if (! $pharmacistUser) {
                return CommonResponse::sendBadResponseWithMessage('User id is not existing');
            }
            if ($pharmacistUser) {
                $pharmacistDetails = Pharmacist::where('user_id', $pharmacistUser->id)->first();
            }
            if ($pharmacistUser->role_as !== 7) {
                return CommonResponse::sendBadResponseWithMessage('Branch id is not existing');
            }
            $pharmacistDetails->delete();
            $pharmacistUser->delete();

            return CommonResponse::sendSuccessResponse('Pharmacist deleted successfully');
        } catch (\Exception $exception) {
            Log::error('DeleteExistingPharmacistUser Error: '.$exception->getMessage());

            return CommonResponse::sendBadResponseWithMessage('User id is not existing');
        }
    }
}
