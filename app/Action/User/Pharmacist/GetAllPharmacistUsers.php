<?php

namespace App\Action\User\Pharmacist;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetAllPharmacistUsers
{
    public function __invoke()
    {
        try {
            $pharmacists = DB::table('pharmacists')
                ->join('users', 'pharmacists.user_id', '=', 'users.id')
                ->select(
                    'users.id',
                    'users.role_as',
                    'pharmacists.id as pharmacist_id',
                    'pharmacists.branch_id',
                    'pharmacists.date_of_birth',
                    'pharmacists.gender',
                    'pharmacists.nic_number',
                    'pharmacists.contact_number_mobile',
                    'pharmacists.contact_number_landline',
                    'users.email',
                    'users.first_name',
                    'users.last_name',
                    'pharmacists.home_address',
                    'pharmacists.emergency_contact_info',
                    'pharmacists.photo',
                    'pharmacists.nic_photo',
                    'pharmacists.pharmacist_registration_number',
                    'pharmacists.qualifications',
                    'pharmacists.years_of_experience',
                    'pharmacists.previous_employment',
                    'pharmacists.license_validity_date',
                    'pharmacists.joining_date',
                    'pharmacists.employee_id',
                    'pharmacists.contract_type',
                    'pharmacists.contract_duration',
                    'pharmacists.probation_start_date',
                    'pharmacists.probation_end_date',
                    'pharmacists.compensation_package'
                )
                ->get();

            return CommonResponse::sendSuccessResponseWithData('pharmacists', $pharmacists);
        } catch (\Exception $exception) {
            return CommonResponse::sendBadResponse();
        }
    }
}
