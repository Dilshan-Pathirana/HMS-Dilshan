<?php

namespace App\Action\User\Doctor;

use Illuminate\Support\Str;
use App\Models\AllUsers\Doctor;
use App\Response\CommonResponse;
use App\Services\Users\CreateUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\EmployeeIdGenerator;
use App\Models\Hospital\DoctorAvailableBranch;
use App\Services\GetBranchDivisionNumberFromBranchId;

class CreateNewDoctorUser
{
    public function __invoke(
        array $validatedDoctorCreateRequest,
        ?string $filePathForPhoto,
        ?string $filePathForNic
    ): array {
        DB::beginTransaction();

        try {
            if ($this->checkNicNumberIsAlreadyHave($validatedDoctorCreateRequest['nic_number'])) {
                return CommonResponse::sendBadResponseWithMessage('A doctor with this NIC already exists.');
            }

            $user = CreateUser::newUser($validatedDoctorCreateRequest, 5);

            if ($this->isUserCreated($user)) {
                throw new \Exception('Failed to create User record.');
            }

            $branchIds = is_string($validatedDoctorCreateRequest['branch_id'])
                ? json_decode($validatedDoctorCreateRequest['branch_id'], true)
                : (array) $validatedDoctorCreateRequest['branch_id'];

            if (! is_array($branchIds) || empty($branchIds)) {
                Log::error('Invalid branch_id format received', ['branch_id' => $validatedDoctorCreateRequest['branch_id']]);
                throw new \Exception('Invalid branch_id format received.');
            }

            $divisionNumber = isset($branchIds[0])
                ? (int) GetBranchDivisionNumberFromBranchId::getBranchDivisionNumber($branchIds[0])
                : 0;

            Log::info('Division number retrieved', ['division_number' => $divisionNumber]);

            $doctor = Doctor::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'date_of_birth' => $validatedDoctorCreateRequest['date_of_birth'],
                'gender' => $validatedDoctorCreateRequest['gender'] ?? null,
                'nic_number' => $validatedDoctorCreateRequest['nic_number'],
                'contact_number_mobile' => $validatedDoctorCreateRequest['contact_number_mobile'],
                'contact_number_landline' => $validatedDoctorCreateRequest['contact_number_landline'],
                'email' => $validatedDoctorCreateRequest['email'],
                'home_address' => $validatedDoctorCreateRequest['home_address'] ?? null,
                'emergency_contact_info' => $validatedDoctorCreateRequest['emergency_contact_info'],
                'photo' => $filePathForPhoto,
                'nic_photo' => $filePathForNic,
                'medical_registration_number' => $validatedDoctorCreateRequest['medical_registration_number'] ?? null,
                'qualifications' => $validatedDoctorCreateRequest['qualifications'] ?? null,
                'years_of_experience' => $validatedDoctorCreateRequest['years_of_experience'] ?? null,
                'areas_of_specialization' => $validatedDoctorCreateRequest['areas_of_specialization'] ?? null,
                'previous_employment' => $validatedDoctorCreateRequest['previous_employment'] ?? null,
                'license_validity_date' => $validatedDoctorCreateRequest['license_validity_date'] ?? null,
                'joining_date' => $validatedDoctorCreateRequest['joining_date'] ?? null,
                'employee_id' => EmployeeIdGenerator::generate(5, $divisionNumber),
                'contract_type' => $validatedDoctorCreateRequest['contract_type'],
                'contract_duration' => $validatedDoctorCreateRequest['contract_duration'] ?? null,
                'probation_start_date' => $validatedDoctorCreateRequest['probation_start_date'] ?? null,
                'probation_end_date' => $validatedDoctorCreateRequest['probation_end_date'] ?? null,
                'compensation_package' => $validatedDoctorCreateRequest['compensation_package'] ?? null,
            ]);

            if (! $doctor) {
                throw new \Exception('Failed to create Doctor record.');
            }

            if (! empty($branchIds)) {
                foreach ($branchIds as $branchId) {
                    try {
                        DoctorAvailableBranch::create([
                            'user_id' => $user->id,
                            'branch_id' => trim($branchId),
                        ]);
                    } catch (\Exception $branchException) {
                        Log::error('Failed to save DoctorAvailableBranch', [
                            'user_id' => $user->id,
                            'branch_id' => $branchId,
                            'error' => $branchException->getMessage(),
                        ]);
                    }
                }
            } else {
                Log::warning('No branches provided for doctor', ['user_id' => $user->id]);
            }

            DB::commit();
            Log::info('Doctor creation process completed successfully', ['user_id' => $user->id]);

            return CommonResponse::sendSuccessResponse('Doctor created successfully.');
        } catch (\Exception $exception) {
            DB::rollBack();
            Log::error('Error in CreateNewDoctorUser', [
                'error' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);

            return CommonResponse::sendBadResponse();
        }
    }

    public function checkNicNumberIsAlreadyHave($nic_number)
    {
        return Doctor::where('nic_number', $nic_number)->exists();
    }

    public function isUserCreated($user): bool
    {
        return ! $user->id;
    }
}
