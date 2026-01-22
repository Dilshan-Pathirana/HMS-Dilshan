<?php

namespace App\Action\User\AllUser;

use Exception;
use App\Models\AllUsers\User;
use App\Response\CommonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\StaticData\VariousUsersTableWithField;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class GetAllUserDetailsForUpdate
{
    public function __invoke(string $userId): array
    {
        try {
            if (empty($userId)) {
                return CommonResponse::sendBadRequestResponse('User ID is required');
            }

            $user = User::findOrFail($userId);

            // Check if this is a staff user (has user_type field) OR a patient stored in users table (role_as = 6) OR supplier entity (role_as = 8)
            if (!empty($user->user_type) || $user->role_as === 6 || $user->role_as === 8) {
                return $this->getStaffUserDetails($user);
            }

            $relevantUserAccordingToTheRole = VariousUsersTableWithField::$usersTableWithField[$user->role_as] ?? null;

            if (! $relevantUserAccordingToTheRole) {
                return CommonResponse::sendBadResponseWithMessage('Invalid user role.');
            }

            $tableName = $relevantUserAccordingToTheRole['table'];
            $fields = $relevantUserAccordingToTheRole['fields'];

            $prefixedFields = $this->buildFieldAliases($tableName, $fields);

            $selectFields = array_merge($prefixedFields, VariousUsersTableWithField::$usersTableColumns);

            $foundedUserByUserId = $this->findUserDetailsById($tableName, $selectFields, $userId);

            if (! $foundedUserByUserId) {
                return CommonResponse::sendBadResponseWithMessage('User details not found.');
            }

            if (isset($foundedUserByUserId->compensation_package)) {
                $foundedUserByUserId->compensation_package = (string) $foundedUserByUserId->compensation_package;
            }

            $preparedSelectedUserDetails = collect($foundedUserByUserId)
                ->merge($this->extractUserUpdateData($user));

            if ($this->isDoctorUser($user)) {
                $doctors_branches = $this->getDoctorBranchDetails($userId);

                $preparedSelectedUserDetails = $preparedSelectedUserDetails->merge(['doctors_branches' => $doctors_branches]);
            }

            return CommonResponse::sendSuccessResponseWithData('update_user_details', $preparedSelectedUserDetails);
        } catch (ModelNotFoundException $e) {
            return CommonResponse::sendBadResponseWithMessage('User not found.');
        } catch (Exception $e) {
            Log::error('Error in GetAllUserDetailsForUpdate: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('An error occurred while fetching user details.');
        }
    }

    private function buildFieldAliases(string $tableName, array $fields): array
    {
        return array_map(function ($field) use ($tableName) {
            return $tableName.'.'.$field.' as '.$tableName.'_'.$field;
        }, $fields);
    }

    private function findUserDetailsById(string $tableName, array $selectFields, string $userId): ?object
    {
        return DB::table($tableName)
            ->join('users', $tableName.'.user_id', '=', 'users.id')
            ->select($selectFields)
            ->where($tableName.'.user_id', $userId)
            ->first();
    }

    private function extractUserUpdateData(User $user): array
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name ?? null,
            'last_name' => $user->last_name ?? null,
            'email' => $user->email ?? null,
            'role_as' => $user->role_as,
        ];
    }

    public function isDoctorUser(User $user): bool
    {
        return $user->role_as === 3;
    }

    public function getDoctorBranchDetails(string $userId): Collection
    {
        return DB::table('doctor_available_branches')
            ->join('branches', 'doctor_available_branches.branch_id', '=', 'branches.id')
            ->select(
                'doctor_available_branches.user_id as user_id',
                'branches.id as branch_id',
                'branches.center_name as branch_center_name'
            )
            ->where('doctor_available_branches.user_id', $userId)
            ->get();
    }

    private function getStaffUserDetails(User $user): array
    {
        // For staff users, all data is in the users table
        $userDetails = (object) [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'nic' => $user->nic,
            'date_of_birth' => $user->date_of_birth,
            'gender' => $user->gender,
            'branch_id' => $user->branch_id,
            'address' => $user->address,
            'user_type' => $user->user_type,
            'joining_date' => $user->joining_date,
            'basic_salary' => $user->basic_salary,
            'role_as' => $user->role_as,
            'is_active' => $user->is_active,
        ];

        return CommonResponse::sendSuccessResponseWithData('update_user_details', $userDetails);
    }
}
