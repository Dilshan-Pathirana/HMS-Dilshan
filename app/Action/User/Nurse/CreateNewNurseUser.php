<?php

namespace App\Action\User\Nurse;

use Illuminate\Support\Str;
use App\Models\AllUsers\User;
use App\Models\AllUsers\Nurse;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\EmployeeIdGenerator;
use App\Services\GetBranchDivisionNumberFromBranchId;

class CreateNewNurseUser
{
    public function __invoke(array $validatedNurseCreateRequest): array
    {
        DB::beginTransaction();

        try {
            $user = User::create([
                'first_name' => $validatedNurseCreateRequest['first_name'],
                'last_name' => $validatedNurseCreateRequest['last_name'],
                'email' => $validatedNurseCreateRequest['email'],
                'password' => Hash::make($validatedNurseCreateRequest['password']),
                'role_as' => 7, // Nurse role
                'branch_id' => $validatedNurseCreateRequest['branch_id'], // Add branch_id to user
            ]);

            if ($user->id) {
                Nurse::create([
                    'id' => Str::uuid(),
                    'user_id' => $user->id,
                    'branch_id' => $validatedNurseCreateRequest['branch_id'] ?? null,
                    'employee_id' => EmployeeIdGenerator::generate(
                        4,
                        GetBranchDivisionNumberFromBranchId::getBranchDivisionNumber(
                            $validatedNurseCreateRequest['branch_id']
                        )
                    ),
                    'date_of_birth' => $validatedNurseCreateRequest['date_of_birth'],
                    'gender' => $validatedNurseCreateRequest['gender'] ?? null,
                    'nic_number' => $validatedNurseCreateRequest['nic_number'] ?? null,
                    'contact_number_mobile' => $validatedNurseCreateRequest['contact_number_mobile'] ?? null,
                    'contact_number_landline' => $validatedNurseCreateRequest['contact_number_landline'] ?? null,
                    'email' => $validatedNurseCreateRequest['email'],
                    'home_address' => $validatedNurseCreateRequest['home_address'] ?? null,
                    'emergency_contact_info' => $validatedNurseCreateRequest['emergency_contact_info'] ?? null,
                    'photo' => $validatedNurseCreateRequest['photo'] ?? null,
                    'nic_photo' => $validatedNurseCreateRequest['nic_photo'] ?? null,
                    'medical_registration_number' => $validatedNurseCreateRequest['medical_registration_number'] ?? null,
                    'qualifications' => $validatedNurseCreateRequest['qualifications'] ?? null,
                    'years_of_experience' => $validatedNurseCreateRequest['years_of_experience'] ?? null,
                    'previous_employment' => $validatedNurseCreateRequest['previous_employment'] ?? null,
                    'license_validity_date' => $validatedNurseCreateRequest['license_validity_date'] ?? null,
                    'joining_date' => $validatedNurseCreateRequest['joining_date'] ?? null,
                    'contract_type' => $validatedNurseCreateRequest['contract_type'],
                    'contract_duration' => $validatedNurseCreateRequest['contract_duration'] ?? null,
                    'probation_start_date' => $validatedNurseCreateRequest['probation_start_date'] ?? null,
                    'probation_end_date' => $validatedNurseCreateRequest['probation_end_date'] ?? null,
                    'compensation_package' => $validatedNurseCreateRequest['compensation_package'] ?? null,
                ]);

                DB::commit();
                return CommonResponse::sendSuccessResponse('Nurse created successfully');
            }
        } catch (\Exception $exception) {
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }

        DB::rollBack();
        return CommonResponse::sendBadResponse();
    }
}
