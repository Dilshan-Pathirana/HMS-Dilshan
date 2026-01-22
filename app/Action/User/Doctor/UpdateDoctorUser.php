<?php

namespace App\Action\User\Doctor;

use App\Models\AllUsers\User;
use App\Models\AllUsers\Doctor;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\Hospital\DoctorAvailableBranch;

class UpdateDoctorUser
{
    public function __invoke(
        Doctor $doctor,
        array $validatedDoctorUpdateRequest,
        ?string $filePathForPhoto = null,
        ?string $filePathForNic = null
    ): array {
        DB::beginTransaction();

        try {
            $user = User::find($doctor->user_id);

            if (! $user) {
                DB::rollBack();

                return CommonResponse::sendBadResponse();
            }

            $userUpdateData = [
                'email' => $validatedDoctorUpdateRequest['email'],
            ];

            if (isset($validatedDoctorUpdateRequest['first_name'])) {
                $userUpdateData['first_name'] = $validatedDoctorUpdateRequest['first_name'];
            }

            if (isset($validatedDoctorUpdateRequest['last_name'])) {
                $userUpdateData['last_name'] = $validatedDoctorUpdateRequest['last_name'];
            }

            $user->update($userUpdateData);

            if (isset($validatedDoctorUpdateRequest['password']) && ! empty($validatedDoctorUpdateRequest['password'])) {
                $user->update([
                    'password' => Hash::make($validatedDoctorUpdateRequest['password']),
                ]);
            }
            if (isset($validatedDoctorUpdateRequest['areas_of_specialization']) && is_array($validatedDoctorUpdateRequest['areas_of_specialization'])) {
                $validatedDoctorUpdateRequest['areas_of_specialization'] = implode(',', $validatedDoctorUpdateRequest['areas_of_specialization']);
            }
            if (isset($validatedDoctorUpdateRequest['branch_ids'])) {
                $branchIds = is_array($validatedDoctorUpdateRequest['branch_ids'])
                    ? $validatedDoctorUpdateRequest['branch_ids']
                    : json_decode($validatedDoctorUpdateRequest['branch_ids'], true);

                if (is_array($branchIds) && ! empty($branchIds)) {
                    DoctorAvailableBranch::where('user_id', $user->id)->delete();

                    foreach ($branchIds as $branchId) {
                        try {
                            DoctorAvailableBranch::create([
                                'user_id' => $user->id,
                                'branch_id' => $branchId,
                            ]);
                        } catch (\Exception $e) {
                            Log::error('Branch update failed', ['error' => $e->getMessage()]);
                        }
                    }
                }
            }
            $updateData = [
                'doctors_branches'=> $validatedDoctorUpdateRequest['branch_ids'] ?? $doctor->doctors_branches,
                'date_of_birth' => $validatedDoctorUpdateRequest['date_of_birth'] ?? $doctor->date_of_birth,
                'gender' => $validatedDoctorUpdateRequest['gender'] ?? $doctor->gender,
                'nic_number' => $validatedDoctorUpdateRequest['nic_number'] ?? $doctor->nic_number,
                'contact_number_mobile' => $validatedDoctorUpdateRequest['contact_number_mobile'] ?? $doctor->contact_number_mobile,
                'contact_number_landline' => $validatedDoctorUpdateRequest['contact_number_landline'] ?? $doctor->contact_number_landline,
                'email' => $validatedDoctorUpdateRequest['email'],
                'home_address' => $validatedDoctorUpdateRequest['home_address'] ?? $doctor->home_address,
                'emergency_contact_info' => $validatedDoctorUpdateRequest['emergency_contact_info'] ?? $doctor->emergency_contact_info,
                'medical_registration_number' => $validatedDoctorUpdateRequest['medical_registration_number'] ?? $doctor->medical_registration_number,
                'qualifications' => $validatedDoctorUpdateRequest['qualifications'] ?? $doctor->qualifications,
                'years_of_experience' => $validatedDoctorUpdateRequest['years_of_experience'] ?? $doctor->years_of_experience,
                'areas_of_specialization' => $validatedDoctorUpdateRequest['areas_of_specialization'] ?? $doctor->areas_of_specialization,
                'previous_employment' => $validatedDoctorUpdateRequest['previous_employment'] ?? $doctor->previous_employment,
                'license_validity_date' => $validatedDoctorUpdateRequest['license_validity_date'] ?? $doctor->license_validity_date,
                'joining_date' => $validatedDoctorUpdateRequest['joining_date'] ?? $doctor->joining_date,
                'contract_type' => $validatedDoctorUpdateRequest['contract_type'] ?? $doctor->contract_type,
                'contract_duration' => $validatedDoctorUpdateRequest['contract_duration'] ?? $doctor->contract_duration,
                'probation_start_date' => $validatedDoctorUpdateRequest['probation_start_date'] ?? $doctor->probation_start_date,
                'probation_end_date' => $validatedDoctorUpdateRequest['probation_end_date'] ?? $doctor->probation_end_date,
                'compensation_package' => $validatedDoctorUpdateRequest['compensation_package'] ?? $doctor->compensation_package,
            ];

            if ($filePathForPhoto) {
                if ($doctor->photo && Storage::disk('public')->exists($doctor->photo)) {
                    Storage::disk('public')->delete($doctor->photo);
                }
                $updateData['photo'] = $filePathForPhoto;
            }

            if ($filePathForNic) {
                if ($doctor->nic_photo && Storage::disk('public')->exists($doctor->nic_photo)) {
                    Storage::disk('public')->delete($doctor->nic_photo);
                }
                $updateData['nic_photo'] = $filePathForNic;
            }

            $doctor->update($updateData);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Doctor updated successfully.');
        } catch (\Exception $exception) {
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
