<?php

namespace App\Action\User\Patient;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetAllPatients
{
    public function __invoke(): array
    {
        try {
            $patients = DB::table('patients')
                ->join('users', 'patients.user_id', '=', 'users.id')
                ->select(
                    'users.id',
                    'users.first_name',
                    'users.last_name',
                )
                ->get();

            return CommonResponse::sendSuccessResponseWithData('patients', $patients);
        } catch (\Exception $exception) {
            return CommonResponse::sendBadResponse();
        }
    }
}
