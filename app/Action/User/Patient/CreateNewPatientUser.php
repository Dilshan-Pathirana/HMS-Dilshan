<?php

namespace App\Action\User\Patient;

use App\Services\SmsSender;
use App\Models\AllUsers\User;
use App\Models\AllUsers\Patient;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\EmployeeIdGenerator;
use App\Services\AuthenticatedUserTokenGenerator;
use App\Services\Users\PatientUserEmailGenerator;
use App\Services\GetBranchDivisionNumberFromBranchId;

class CreateNewPatientUser
{
    private string $password;

    public Patient $patient;

    public function __invoke(array $patientDetails): array
    {
        DB::beginTransaction();

        try {
            if (Patient::where('nic', $patientDetails['NIC'])->exists()) {
                return CommonResponse::sendBadResponseWithMessage('A patient with this NIC already exists.');
            }
            if (Patient::where('phone', $patientDetails['phone'])->exists()) {
                return CommonResponse::sendBadResponseWithMessage('A patient with this Phone Number already exists.');
            }

            $user = $this->createUserForPatient($patientDetails);

            if (! $user->id) {
                throw new \Exception('Failed to create User record.');
            }

            $this->patient = $this->createPatientUser($user, $patientDetails);

            if (! $this->patient->id) {
                throw new \Exception('Failed to create Patient record.');
            }

            SmsSender::sendSMS($this->patient->phone, 'Your login credential is '.PHP_EOL.' user name: '.$this->patient->phone.PHP_EOL.' password: '.$this->password);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Patient created successfully.');
        } catch (\Exception $exception) {
            DB::rollBack();

            return CommonResponse::sendBadResponseWithMessage('Internal Server Error: '.$exception->getMessage());
        }
    }

    private function createUserForPatient(array $patientDetails): User
    {
        $this->password = AuthenticatedUserTokenGenerator::getPassword();

        return User::create([
            'first_name' => $patientDetails['first_name'],
            'last_name' => $patientDetails['last_name'],
            'email' => PatientUserEmailGenerator::generate($patientDetails['first_name'], $patientDetails['last_name']),
            'password' => Hash::make($this->password),
            'role_as' => 5, // Patient role
        ]);
    }

    private function createPatientUser(User $user, array $patientDetails): Patient
    {
        return Patient::create([
            'user_id' => $user->id,
            'first_name' => $patientDetails['first_name'],
            'last_name' => $patientDetails['last_name'],
            'branch_id' => $patientDetails['branch_id'],
            'patient_id' => EmployeeIdGenerator::generate(
                6,
                GetBranchDivisionNumberFromBranchId::getBranchDivisionNumber(
                    $patientDetails['branch_id']
                )
            ),
            'phone' => $patientDetails['phone'],
            'nic' => $patientDetails['NIC'] ?? '',
            'email' => $patientDetails['email'] ?? '',
            'address' => $patientDetails['address'] ?? '',
            'city' => $patientDetails['city'] ?? '',
            'date_of_birth' => $patientDetails['date_of_birth'] ?? null,
            'gender' => $patientDetails['gender'] ?? '',
            'blood_type' => $patientDetails['blood_type'] ?? '',
            'emergency_contact_name' => $patientDetails['emergency_contact_name'] ?? '',
            'emergency_contact_phone' => $patientDetails['emergency_contact_phone'] ?? '',
        ]);
    }

    public function getNewlyCreatedPatientUsers(): Patient
    {
        if (! isset($this->patient)) {
            throw new \LogicException('Patient has not been created yet.');
        }

        return $this->patient;
    }
}
