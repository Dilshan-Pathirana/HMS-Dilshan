<?php

namespace App\Action\User\Nurse;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetAllNurseUsers
{
    public function __invoke(): array
    {
        try {
            $nurses = DB::table('nurses')
                ->join('users', 'nurses.user_id', '=', 'users.id')
                ->select(
                    'users.id',
                    'nurses.id as nurse_id',
                    'nurses.branch_id',
                    'nurses.date_of_birth',
                    'nurses.gender',
                    'nurses.nic_number',
                    'nurses.contact_number_mobile',
                    'nurses.contact_number_landline',
                    'users.email',
                    'users.first_name',
                    'users.last_name',
                    'nurses.home_address',
                    'nurses.emergency_contact_info',
                    'nurses.photo',
                    'nurses.nic_photo',
                    'nurses.medical_registration_number',
                    'nurses.qualifications',
                    'nurses.years_of_experience',
                    'nurses.previous_employment',
                    'nurses.license_validity_date',
                    'nurses.joining_date',
                    'nurses.employee_id',
                    'nurses.contract_type',
                    'nurses.contract_duration',
                    'nurses.probation_start_date',
                    'nurses.probation_end_date',
                    'nurses.compensation_package'
                )
                ->get();

            return CommonResponse::sendSuccessResponseWithData('nurses', $nurses);
        } catch (\Exception $exception) {
            return CommonResponse::sendBadResponse();
        }
    }
}
