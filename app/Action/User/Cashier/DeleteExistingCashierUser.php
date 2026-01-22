<?php

namespace App\Action\User\Cashier;

use App\Models\AllUsers\User;
use App\Models\AllUsers\Cashier;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;

class DeleteExistingCashierUser
{
    public function __invoke(string $userId): array
    {
        try {
            $CashierUser = User::findOrFail($userId);
            if (! $CashierUser) {
                return CommonResponse::sendBadResponseWithMessage('User id is not existing');
            }
            if ($CashierUser) {
                $CashierDetails = Cashier::where('user_id', $CashierUser->id)->first();
            }
            if ($CashierUser->role_as !== 6) {
                return CommonResponse::sendBadResponseWithMessage('Branch id is not existing');
            }
            $CashierDetails->delete();
            $CashierUser->delete();

            return CommonResponse::sendSuccessResponse('Cashier deleted successfully');
        } catch (\Exception $e) {
            Log::error('DeleteExistingCashierUser Error: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('User id is not existing');
        }
    }
}
