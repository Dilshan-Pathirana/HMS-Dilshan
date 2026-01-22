<?php

namespace App\Action\User\Doctor;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetAllDoctorUsers
{
    public function __invoke(): array
    {
        try {
            $doctors = DB::table('doctors')
                ->join('users', 'doctors.user_id', '=', 'users.id')
                ->select(
                    'doctors.id',
                    'users.id as user_id',
                    'doctors.date_of_birth',
                    'doctors.gender',
                    'doctors.nic_number',
                    'doctors.contact_number_mobile',
                    'doctors.contact_number_landline',
                    'users.email',
                    'users.first_name',
                    'users.last_name',
                    'users.role_as',
                    'doctors.home_address',
                    'doctors.emergency_contact_info',
                    'doctors.photo',
                    'doctors.nic_photo',
                    'doctors.medical_registration_number',
                    'doctors.qualifications',
                    'doctors.years_of_experience',
                    'doctors.areas_of_specialization',
                    'doctors.previous_employment',
                    'doctors.license_validity_date',
                    'doctors.joining_date',
                    'doctors.employee_id',
                    'doctors.contract_type',
                    'doctors.contract_duration',
                    'doctors.probation_start_date',
                    'doctors.probation_end_date',
                    'doctors.compensation_package'
                )
                ->get();

            $doctorBranches = DB::table('doctor_available_branches')
                ->join('branches', 'doctor_available_branches.branch_id', '=', 'branches.id')
                ->select(
                    'doctor_available_branches.user_id',
                    'branches.id as branch_id',
                    'branches.center_name as branch_center_name'
                )
                ->get()
                ->groupBy('user_id');

            $doctors->transform(function ($doctor) use ($doctorBranches) {
                $doctor->branches = $doctorBranches[$doctor->user_id] ?? [];

                return $doctor;
            });

            return CommonResponse::sendSuccessResponseWithData('doctors', $doctors);
        } catch (\Exception $exception) {
            return CommonResponse::sendBadResponse();
        }
    }
}
