<?php

namespace App\Http\Controllers\Users;

use App\Models\AllUsers\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Action\User\Patient\GetAllPatients;
use App\Action\User\Patient\GetPatientByPhone;
use App\Action\User\Patient\UpdatePatientUser;
use App\Http\Requests\PatientUserUpdateRequest;
use App\Action\User\Patient\CreateNewPatientUser;
use App\Http\Requests\User\PatientUserCreateRequest;
use App\Action\User\Patient\DeleteExistingpatientUser;
use App\Action\User\Patient\GetUserIdToPatientDetails;
use App\Action\User\Patient\CreatePatientUserNewPassword;
use App\Http\Requests\User\PatientUserForgotPasswordRequest;

class PatientController extends Controller
{
    public function createPatient(
        PatientUserCreateRequest $request,
        CreateNewPatientUser $createNewPatientUser
    ): JsonResponse {
        try {
            $validatedPatientRequest = $request->validated();

            return response()->json(
                $createNewPatientUser($validatedPatientRequest)
            );
        } catch (\Exception $exception) {
            Log::error('Error creating Patient: '.$exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json(['status' => 500, 'message' => 'Internal Server Error'], 500);
        }
    }

    public function getPatientDetailsByUserID(string $userId, GetUserIdToPatientDetails $getUserIdToPatientDetails): JsonResponse
    {
        return response()->json($getUserIdToPatientDetails($userId));
    }

    public function getPatientsDetails(GetAllPatients $getAllPatients): JsonResponse
    {
        return response()->json($getAllPatients());
    }

    public function forgotPassword(PatientUserForgotPasswordRequest $request, CreatePatientUserNewPassword $createPatientUserNewPassword): JsonResponse
    {
        $validatedPasswordRequest = $request->validated();

        return response()->json($createPatientUserNewPassword($validatedPasswordRequest));
    }

    public function updatePatient(
        $user_id,
        PatientUserUpdateRequest $request,
        UpdatePatientUser $updatePatientUser
    ): JsonResponse {
        $patient = Patient::where('user_id', $user_id)->firstOrFail();

        $validatedPatientUpdateRequest = $request->validated();

        $filePathForPhoto = null;

        if ($request->hasFile('photo')) {
            $filePathForPhoto = $request->file('photo')->store('documents/patient', 'public');
        }

        return response()->json(
            $updatePatientUser(
                $patient,
                $validatedPatientUpdateRequest,
                $filePathForPhoto
            )
        );
    }

    public function deletepatient(string $user_id, DeleteExistingpatientUser $deleteExistingpatientUser): JsonResponse
    {
        return response()->json($deleteExistingpatientUser($user_id));
    }

    public function getPatientByPhone(string $phone, GetPatientByPhone $getPatientByPhone): JsonResponse
    {
        return response()->json($getPatientByPhone($phone));
    }

    /**
     * Check if a phone number already exists in the system (public endpoint)
     */
    public function checkPhoneExists(string $phone): JsonResponse
    {
        try {
            $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
            $exists = Patient::where('phone', $cleanPhone)->exists();
            
            return response()->json([
                'status' => 200,
                'exists' => $exists,
                'message' => $exists 
                    ? 'This phone number is already registered. Please use a different number or login to your existing account.' 
                    : 'Phone number is available.'
            ]);
        } catch (\Exception $exception) {
            Log::error('Error checking phone existence: '.$exception->getMessage());
            return response()->json([
                'status' => 500,
                'exists' => false,
                'message' => 'Error checking phone number.'
            ], 500);
        }
    }

    /**
     * Check if phone, NIC, or email already exists in the system (public endpoint for signup validation)
     */
    public function checkCredentialsExist(): JsonResponse
    {
        try {
            $phone = request()->query('phone', '');
            $nic = request()->query('nic', '');
            $email = request()->query('email', '');
            
            Log::info('Checking credentials - Phone: ' . $phone . ', NIC: ' . $nic . ', Email: ' . $email);
            
            $conflicts = [];
            
            // Check phone
            if (!empty($phone)) {
                $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
                $phoneExists = Patient::where('phone', $cleanPhone)->exists();
                Log::info('Phone check: ' . $cleanPhone . ' exists: ' . ($phoneExists ? 'yes' : 'no'));
                if ($phoneExists) {
                    $conflicts[] = [
                        'field' => 'phone',
                        'label' => 'Phone Number',
                        'message' => 'This phone number is already registered in our system.'
                    ];
                }
            }
            
            // Check NIC (case-insensitive)
            if (!empty($nic)) {
                $cleanNic = trim($nic);
                $nicExists = Patient::whereRaw('LOWER(NIC) = ?', [strtolower($cleanNic)])->exists();
                Log::info('NIC check: ' . $cleanNic . ' exists: ' . ($nicExists ? 'yes' : 'no'));
                if ($nicExists) {
                    $conflicts[] = [
                        'field' => 'NIC',
                        'label' => 'NIC Number',
                        'message' => 'This NIC number is already registered in our system.'
                    ];
                }
            }
            
            // Check email (case-insensitive)
            if (!empty($email)) {
                $cleanEmail = strtolower(trim($email));
                $emailExists = Patient::whereRaw('LOWER(email) = ?', [$cleanEmail])->exists();
                Log::info('Email check: ' . $cleanEmail . ' exists: ' . ($emailExists ? 'yes' : 'no'));
                if ($emailExists) {
                    $conflicts[] = [
                        'field' => 'email',
                        'label' => 'Email Address',
                        'message' => 'This email address is already registered in our system.'
                    ];
                }
            }
            
            $hasConflicts = count($conflicts) > 0;
            
            Log::info('Conflicts found: ' . count($conflicts));
            
            return response()->json([
                'status' => 200,
                'hasConflicts' => $hasConflicts,
                'conflicts' => $conflicts,
                'message' => $hasConflicts 
                    ? 'Some of your information is already registered. Please check the details below.'
                    : 'All credentials are available.'
            ]);
        } catch (\Exception $exception) {
            Log::error('Error checking credentials existence: '.$exception->getMessage());
            return response()->json([
                'status' => 500,
                'hasConflicts' => false,
                'conflicts' => [],
                'message' => 'Error checking credentials.'
            ], 500);
        }
    }

    /**
     * Search patients by name, phone, or email for POS billing
     */
    public function searchPatients(): JsonResponse
    {
        try {
            $query = request()->query('q', '');
            
            if (strlen($query) < 2) {
                return response()->json([]);
            }

            $patients = Patient::query()
                ->where(function($q) use ($query) {
                    $q->where('first_name', 'LIKE', "%{$query}%")
                      ->orWhere('last_name', 'LIKE', "%{$query}%")
                      ->orWhere('phone_number', 'LIKE', "%{$query}%")
                      ->orWhere('email', 'LIKE', "%{$query}%");
                })
                ->limit(10)
                ->get(['id', 'first_name', 'last_name', 'phone_number as phone', 'email']);

            return response()->json($patients);
        } catch (\Exception $exception) {
            Log::error('Error searching patients: '.$exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json(['status' => 500, 'message' => 'Internal Server Error'], 500);
        }
    }
}
