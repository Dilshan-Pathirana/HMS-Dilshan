<?php

namespace App\Action\User\Cashier;

use Illuminate\Support\Str;
use App\Models\AllUsers\User;
use App\Models\AllUsers\Cashier;
use App\Response\CommonResponse;
use App\Services\Users\CreateUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\EmployeeIdGenerator;
use App\Services\GetBranchDivisionNumberFromBranchId;

class CreateNewCashierUser
{
    public function __invoke(
        array $validatedCashierCreateRequest,
        string $filePathForPhoto,
        string $filePathForNic
    ): array {
        DB::beginTransaction();

        try {
            $user = CreateUser::newUser($validatedCashierCreateRequest, 3);

            if ($user->id) {
                $this->createCashierUser($user, $validatedCashierCreateRequest, $filePathForPhoto, $filePathForNic);

                DB::commit();

                return CommonResponse::sendSuccessResponse('Cashier User Created Successfully');
            }
        } catch (\Exception $exception) {
            Log::info($exception->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }

        return CommonResponse::sendBadResponse();
    }

    private function createCashierUser(
        User $user,
        array $validatedCashierCreateRequest,
        string $filePathForPhoto,
        string $filePathForNic
    ): void {
        Cashier::create([
            'id' => Str::uuid(),
            'user_id' => $user->id,
            'branch_id' => $validatedCashierCreateRequest['branch_id'],
            'date_of_birth' => $validatedCashierCreateRequest['date_of_birth'] ?? null,
            'gender' => $validatedCashierCreateRequest['gender'] ?? null,
            'nic_number' => $validatedCashierCreateRequest['nic_number'] ?? null,
            'contact_number_mobile' => $validatedCashierCreateRequest['contact_number_mobile'] ?? null,
            'contact_number_landline' => $validatedCashierCreateRequest['contact_number_landline'] ?? null,
            'email' => $validatedCashierCreateRequest['email'],
            'home_address' => $validatedCashierCreateRequest['home_address'] ?? null,
            'emergency_contact_info' => $validatedCashierCreateRequest['emergency_contact_info'] ?? null,
            'photo' => $filePathForPhoto,
            'nic_photo' => $filePathForNic,
            'qualifications' => $validatedCashierCreateRequest['qualifications'] ?? null,
            'years_of_experience' => $validatedCashierCreateRequest['years_of_experience'] ?? null,
            'joining_date' => $validatedCashierCreateRequest['joining_date'] ?? null,
            'employee_id' => EmployeeIdGenerator::generate(
                3,
                GetBranchDivisionNumberFromBranchId::getBranchDivisionNumber(
                    $validatedCashierCreateRequest['branch_id']
                )
            ),
            'contract_type' => $validatedCashierCreateRequest['contract_type'] ?? 'full-time',
            'contract_duration' => $validatedCashierCreateRequest['contract_duration'] ?? null,
            'compensation_package' => $validatedCashierCreateRequest['compensation_package'] ?? null,
        ]);
    }
}
