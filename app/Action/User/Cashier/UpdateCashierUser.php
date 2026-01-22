<?php

namespace App\Action\User\Cashier;

use App\Models\AllUsers\User;
use App\Models\AllUsers\Cashier;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UpdateCashierUser
{
    public function __invoke(
        Cashier $cashier,
        array $validatedCashierUpdateRequest,
        ?string $filePathForPhoto = null,
        ?string $filePathForNic = null
    ): array {
        DB::beginTransaction();

        try {
            $user = User::find($cashier->user_id);

            if (! $user) {
                DB::rollBack();

                return CommonResponse::sendBadResponse();
            }

            $userUpdateData = [
                'email' => $validatedCashierUpdateRequest['email'],
            ];

            if (isset($validatedCashierUpdateRequest['first_name'])) {
                $userUpdateData['first_name'] = $validatedCashierUpdateRequest['first_name'];
            }

            if (isset($validatedCashierUpdateRequest['last_name'])) {
                $userUpdateData['last_name'] = $validatedCashierUpdateRequest['last_name'];
            }

            $user->update($userUpdateData);

            if (isset($validatedCashierUpdateRequest['password']) && ! empty($validatedCashierUpdateRequest['password'])) {
                $user->update([
                    'password' => Hash::make($validatedCashierUpdateRequest['password']),
                ]);
            }

            $updateData = [
                'branch_id' => $validatedCashierUpdateRequest['branch_id'] ?? $cashier->branch_id,
                'date_of_birth' => $validatedCashierUpdateRequest['date_of_birth'] ?? $cashier->date_of_birth,
                'gender' => $validatedCashierUpdateRequest['gender'] ?? $cashier->gender,
                'nic_number' => $validatedCashierUpdateRequest['nic_number'] ?? $cashier->nic_number,
                'contact_number_mobile' => $validatedCashierUpdateRequest['contact_number_mobile'] ?? $cashier->contact_number_mobile,
                'contact_number_landline' => $validatedCashierUpdateRequest['contact_number_landline'] ?? $cashier->contact_number_landline,
                'email' => $validatedCashierUpdateRequest['email'],
                'home_address' => $validatedCashierUpdateRequest['home_address'] ?? $cashier->home_address,
                'emergency_contact_info' => $validatedCashierUpdateRequest['emergency_contact_info'] ?? $cashier->emergency_contact_info,
                'qualifications' => $validatedCashierUpdateRequest['qualifications'] ?? $cashier->qualifications,
                'years_of_experience' => $validatedCashierUpdateRequest['years_of_experience'] ?? $cashier->years_of_experience,
                'joining_date' => $validatedCashierUpdateRequest['joining_date'] ?? $cashier->joining_date,
                'contract_type' => $validatedCashierUpdateRequest['contract_type'] ?? $cashier->contract_type,
                'contract_duration' => $validatedCashierUpdateRequest['contract_duration'] ?? $cashier->contract_duration,
                'compensation_package' => $validatedCashierUpdateRequest['compensation_package'] ?? $cashier->compensation_package,
            ];

            if ($filePathForPhoto) {
                if ($cashier->photo && Storage::disk('public')->exists($cashier->photo)) {
                    Storage::disk('public')->delete($cashier->photo);
                }
                $updateData['photo'] = $filePathForPhoto;
            }

            if ($filePathForNic) {
                if ($cashier->nic_photo && Storage::disk('public')->exists($cashier->nic_photo)) {
                    Storage::disk('public')->delete($cashier->nic_photo);
                }
                $updateData['nic_photo'] = $filePathForNic;
            }

            $cashier->update($updateData);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Cashier updated successfully.');
        } catch (\Exception $exception) {
            Log::error($exception->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
