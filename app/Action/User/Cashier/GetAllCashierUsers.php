<?php

namespace App\Action\User\Cashier;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetAllCashierUsers
{
    public function __invoke()
    {
        try {
            $cashiers = DB::table('cashiers')
                ->join('users', 'cashiers.user_id', '=', 'users.id')
                ->select(
                    'users.id',
                    'cashiers.id as cashier_id',
                    'cashiers.branch_id',
                    'cashiers.date_of_birth',
                    'cashiers.gender',
                    'cashiers.nic_number',
                    'cashiers.contact_number_mobile',
                    'cashiers.contact_number_landline',
                    'users.email',
                    'users.first_name',
                    'users.last_name',
                    'cashiers.home_address',
                    'cashiers.emergency_contact_info',
                    'cashiers.photo',
                    'cashiers.nic_photo',
                    'cashiers.qualifications',
                    'cashiers.years_of_experience',
                    'cashiers.previous_employment',
                    'cashiers.license_validity_date',
                    'cashiers.joining_date',
                    'cashiers.employee_id',
                    'cashiers.contract_type',
                    'cashiers.contract_duration',
                    'cashiers.compensation_package'
                )
                ->get();

            return CommonResponse::sendSuccessResponseWithData('cashiers', $cashiers);
        } catch (\Exception $exception) {
            return CommonResponse::sendBadResponse();
        }
    }
}
