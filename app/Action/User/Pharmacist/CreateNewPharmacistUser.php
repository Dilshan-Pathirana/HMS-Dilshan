<?php

namespace App\Action\User\Pharmacist;

use Illuminate\Support\Str;
use App\Models\AllUsers\User;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\AllUsers\Pharmacist;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Services\EmployeeIdGenerator;
use App\Services\GetBranchDivisionNumberFromBranchId;

class CreateNewPharmacistUser
{
    public function __invoke(
        array $validatedPharmacistCreateRequest,
        string $filePathForPhoto,
        string $filePathForNic
    ): array {
        DB::beginTransaction();

        try {
            $user = User::create([
                'first_name' => $validatedPharmacistCreateRequest['first_name'],
                'last_name' => $validatedPharmacistCreateRequest['last_name'],
                'email' => $validatedPharmacistCreateRequest['email'],
                'password' => Hash::make($validatedPharmacistCreateRequest['password']),
                'role_as' => 4,
                'branch_id' => $validatedPharmacistCreateRequest['branch_id'],
                'basic_salary' => $validatedPharmacistCreateRequest['basic_salary'] ?? null,
            ]);

            if ($user->id) {
                Pharmacist::create([
                    'id' => Str::uuid(),
                    'user_id' => $user->id,
                    'branch_id' => $validatedPharmacistCreateRequest['branch_id'],
                    'date_of_birth' => $validatedPharmacistCreateRequest['date_of_birth'] ?? null,
                    'gender' => $validatedPharmacistCreateRequest['gender'] ?? null,
                    'nic_number' => $validatedPharmacistCreateRequest['nic_number'] ?? null,
                    'contact_number_mobile' => $validatedPharmacistCreateRequest['contact_number_mobile'] ?? null,
                    'contact_number_landline' => $validatedPharmacistCreateRequest['contact_number_landline'] ?? null,
                    'email' => $validatedPharmacistCreateRequest['email'],
                    'home_address' => $validatedPharmacistCreateRequest['home_address'] ?? null,
                    'emergency_contact_info' => $validatedPharmacistCreateRequest['emergency_contact_info'] ?? null,
                    'photo' => $filePathForPhoto,
                    'nic_photo' => $filePathForNic,
                    'pharmacist_registration_number' => $validatedPharmacistCreateRequest['pharmacist_registration_number'] ?? null,
                    'qualifications' => $validatedPharmacistCreateRequest['qualifications'] ?? null,
                    'years_of_experience' => $validatedPharmacistCreateRequest['years_of_experience'] ?? null,
                    'previous_employment' => $validatedPharmacistCreateRequest['previous_employment'] ?? null,
                    'license_validity_date' => $validatedPharmacistCreateRequest['license_validity_date'] ?? null,
                    'joining_date' => $validatedPharmacistCreateRequest['joining_date'] ?? null,
                    'employee_id' => EmployeeIdGenerator::generate(
                        3,
                        GetBranchDivisionNumberFromBranchId::getBranchDivisionNumber(
                            $validatedPharmacistCreateRequest['branch_id']
                        )
                    ),
                    'contract_type' => $validatedPharmacistCreateRequest['contract_type'] ?? 'full-time',
                    'contract_duration' => $validatedPharmacistCreateRequest['contract_duration'] ?? null,
                    'probation_start_date' => $validatedPharmacistCreateRequest['probation_start_date'] ?? null,
                    'probation_end_date' => $validatedPharmacistCreateRequest['probation_end_date'] ?? null,
                    'compensation_package' => $validatedPharmacistCreateRequest['compensation_package'] ?? null,
                ]);

                DB::commit();

                return CommonResponse::sendSuccessResponse('Pharmacist created successfully.');
            }
        } catch (\Exception $exception) {
            Log::error($exception->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }

        return CommonResponse::sendBadResponse();
    }
}
