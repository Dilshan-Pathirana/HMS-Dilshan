<?php

namespace App\Action\User\Patient;

use App\Models\AllUsers\User;
use App\Models\AllUsers\Patient;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UpdatePatientUser
{
    public function __invoke(
        Patient $patient,
        array $validatedPatientUpdateRequest,
        ?string $filePathForPhoto = null
    ): array {
        DB::beginTransaction();

        try {
            $user = User::find($patient->user_id);
            if (! $user) {
                DB::rollBack();

                return CommonResponse::sendBadResponseWithMessage('User record not found for patient.');
            }

            if ($validatedPatientUpdateRequest['email'] !== $user->email) {
                $emailExists = User::where('email', $validatedPatientUpdateRequest['email'])
                    ->where('id', '!=', $user->id)
                    ->exists();

                if ($emailExists) {
                    DB::rollBack();

                    return CommonResponse::sendBadResponseWithMessage('A patient with this email already exists.');
                }
            }

            $userUpdateData = [
                'first_name' => $validatedPatientUpdateRequest['first_name'],
                'last_name' => $validatedPatientUpdateRequest['last_name'],
                'email' => $validatedPatientUpdateRequest['email'],
            ];
            $user->update($userUpdateData);

            if (isset($validatedPatientUpdateRequest['password']) && ! empty($validatedPatientUpdateRequest['password'])) {
                $user->update([
                    'password' => Hash::make($validatedPatientUpdateRequest['password']),
                ]);
            }

            $patientUpdateData = [
                'first_name' => $validatedPatientUpdateRequest['first_name'],
                'last_name' => $validatedPatientUpdateRequest['last_name'],
                'branch_id' => $validatedPatientUpdateRequest['branch_id'],
                'phone' => $validatedPatientUpdateRequest['phone'] ??
                        $validatedPatientUpdateRequest['contact_number_mobile'] ??
                        $patient->phone,
                'NIC' => $validatedPatientUpdateRequest['NIC'],
                'email' => $validatedPatientUpdateRequest['email'] ?? '',
                'address' => $validatedPatientUpdateRequest['address'] ??
                        $validatedPatientUpdateRequest['home_address'] ??
                        $patient->address,
            ];

            if ($filePathForPhoto) {
                if ($patient->photo && Storage::disk('public')->exists($patient->photo)) {
                    Storage::disk('public')->delete($patient->photo);
                }
                $patientUpdateData['photo'] = $filePathForPhoto;
            }

            $patient->update($patientUpdateData);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Patient updated successfully.');
        } catch (\Exception $exception) {
            DB::rollBack();

            return CommonResponse::sendBadResponseWithMessage('Failed to update patient. Please try again.');
        }
    }
}
