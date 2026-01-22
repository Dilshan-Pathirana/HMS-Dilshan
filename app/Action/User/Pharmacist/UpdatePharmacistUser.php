<?php

namespace App\Action\User\Pharmacist;

use App\Models\AllUsers\User;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\AllUsers\Pharmacist;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UpdatePharmacistUser
{
    public function __invoke(
        Pharmacist $pharmacist,
        array $validatedPharmacistUpdateRequest,
        ?string $filePathForPhoto = null,
        ?string $filePathForNic = null
    ): array {
        DB::beginTransaction();

        try {
            $user = User::find($pharmacist->user_id);

            if (! $user) {
                DB::rollBack();

                return CommonResponse::sendBadResponse();
            }

            if ($validatedPharmacistUpdateRequest['email'] !== $user->email) {
                $emailExists = User::where('email', $validatedPharmacistUpdateRequest['email'])
                    ->where('id', '!=', $user->id)
                    ->exists();

                if ($emailExists) {
                    DB::rollBack();

                    return CommonResponse::sendBadResponse();
                }
            }

            $userUpdateData = [
                'email' => $validatedPharmacistUpdateRequest['email'],
            ];

            if (isset($validatedPharmacistUpdateRequest['first_name'])) {
                $userUpdateData['first_name'] = $validatedPharmacistUpdateRequest['first_name'];
            }

            if (isset($validatedPharmacistUpdateRequest['last_name'])) {
                $userUpdateData['last_name'] = $validatedPharmacistUpdateRequest['last_name'];
            }

            $user->update($userUpdateData);

            if (isset($validatedPharmacistUpdateRequest['password']) && ! empty($validatedPharmacistUpdateRequest['password'])) {
                $user->update([
                    'password' => Hash::make($validatedPharmacistUpdateRequest['password']),
                ]);
            }

            $updateData = [
                'email' => $validatedPharmacistUpdateRequest['email'],
                'branch_id' => $validatedPharmacistUpdateRequest['branch_id'] ?? $pharmacist->branch_id,
                'date_of_birth' => $validatedPharmacistUpdateRequest['date_of_birth'] ?? $pharmacist->date_of_birth,
                'gender' => $validatedPharmacistUpdateRequest['gender'] ?? $pharmacist->gender,
                'nic_number' => $validatedPharmacistUpdateRequest['nic_number'] ?? $pharmacist->nic_number,
                'contact_number_mobile' => $validatedPharmacistUpdateRequest['contact_number_mobile'] ?? $pharmacist->contact_number_mobile,
                'contact_number_landline' => $validatedPharmacistUpdateRequest['contact_number_landline'] ?? $pharmacist->contact_number_landline,
                'home_address' => $validatedPharmacistUpdateRequest['home_address'] ?? $pharmacist->home_address,
                'emergency_contact_info' => $validatedPharmacistUpdateRequest['emergency_contact_info'] ?? $pharmacist->emergency_contact_info,
                'qualifications' => $validatedPharmacistUpdateRequest['qualifications'] ?? $pharmacist->qualifications,
                'years_of_experience' => $validatedPharmacistUpdateRequest['years_of_experience'] ?? $pharmacist->years_of_experience,
                'previous_employment' => $validatedPharmacistUpdateRequest['previous_employment'] ?? $pharmacist->previous_employment,
                'employee_id' => $validatedPharmacistUpdateRequest['employee_id'] ?? $pharmacist->employee_id,
                'license_validity_date' => $validatedPharmacistUpdateRequest['license_validity_date'] ?? $pharmacist->license_validity_date,
                'joining_date' => $validatedPharmacistUpdateRequest['joining_date'] ?? $pharmacist->joining_date,
                'contract_type' => $validatedPharmacistUpdateRequest['contract_type'] ?? $pharmacist->contract_type,
                'contract_duration' => $validatedPharmacistUpdateRequest['contract_duration'] ?? $pharmacist->contract_duration,
                'probation_start_date' => $validatedPharmacistUpdateRequest['probation_start_date'] ?? $pharmacist->probation_start_date,
                'probation_end_date' => $validatedPharmacistUpdateRequest['probation_end_date'] ?? $pharmacist->probation_end_date,
                'compensation_package' => $validatedPharmacistUpdateRequest['compensation_package'] ?? $pharmacist->compensation_package,
            ];

            if (isset($validatedPharmacistUpdateRequest['pharmacist_registration_number'])) {
                $updateData['pharmacist_registration_number'] = $validatedPharmacistUpdateRequest['pharmacist_registration_number'];
            }

            if ($filePathForPhoto) {
                if ($pharmacist->photo && Storage::disk('public')->exists($pharmacist->photo)) {
                    Storage::disk('public')->delete($pharmacist->photo);
                }
                $updateData['photo'] = $filePathForPhoto;
            }

            if ($filePathForNic) {
                if ($pharmacist->nic_photo && Storage::disk('public')->exists($pharmacist->nic_photo)) {
                    Storage::disk('public')->delete($pharmacist->nic_photo);
                }
                $updateData['nic_photo'] = $filePathForNic;
            }

            $pharmacist->update($updateData);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Pharmacist updated successfully.');
        } catch (\Exception $exception) {
            Log::error('Pharmacist update error: '.$exception->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
