<?php

namespace App\Action\User\AllUser;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Query\Builder;

class GetAllUsers
{
    public function __invoke(): array
    {
        try {
            // Tables that have user_id relationship
            $roles = [
                'cashiers'    => 'user_id',
                'nurses'      => 'nurse_id',
                'pharmacists' => 'pharmacist_id',
                'doctors'     => 'doctor_id',
            ];

            $queries = [];

            foreach ($roles as $table => $idAlias) {
                $queries[] = $this->getUserQuery($table, $idAlias);
            }

            // Add query for staff users with user_type (new staff types)
            $queries[] = $this->getStaffUserQuery();
            
            // Add query for users with role_as=6 (patients stored directly in users table)
            $queries[] = $this->getPatientUserQuery();

            $firstQuery = array_shift($queries);
            $combinedQuery = array_reduce($queries, function ($carry, $query) {
                return $carry->union($query);
            }, $firstQuery);

            $allUsers = $combinedQuery->get();

            return CommonResponse::sendSuccessResponseWithData('users', $allUsers);
        } catch (\Exception $exception) {
            Log::info($exception->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }

    private function getUserQuery(string $table, string $idAlias): Builder
    {
        // Check if table has branch_id column
        $hasBranchId = in_array($table, ['patients', 'cashiers', 'nurses', 'pharmacists']);
        
        $query = DB::table($table)
            ->join('users', "{$table}.user_id", '=', 'users.id');
            
        // Join branches based on whether table has branch_id or use users.branch_id
        if ($hasBranchId) {
            $query->leftJoin('branches', "{$table}.branch_id", '=', 'branches.id');
            $branchIdColumn = "{$table}.branch_id";
        } else {
            $query->leftJoin('branches', 'users.branch_id', '=', 'branches.id');
            $branchIdColumn = 'users.branch_id';
        }
        
        return $query->select(
            'users.id',
            'users.first_name',
            'users.last_name',
            'users.email',
            'users.role_as',
            DB::raw("NULL as user_type"),
            DB::raw("{$branchIdColumn} as branch_id"),
            DB::raw('COALESCE(branches.center_name, "Not Assigned") as center_name'),
            DB::raw($table === 'patients' ? "{$table}.phone_number as contact_number_mobile" : "{$table}.contact_number_mobile"),
            DB::raw("'{$idAlias}' as id_type"),
            DB::raw("{$table}.id as related_id")
        );
    }

    private function getStaffUserQuery(): Builder
    {
        return DB::table('users')
            ->leftJoin('branches', 'users.branch_id', '=', 'branches.id')
            ->select(
                'users.id',
                'users.first_name',
                'users.last_name',
                'users.email',
                'users.role_as',
                'users.user_type',
                'users.branch_id',
                DB::raw('COALESCE(branches.center_name, "Not Assigned") as center_name'),
                DB::raw('COALESCE(users.phone, "N/A") as contact_number_mobile'),
                DB::raw("'staff' as id_type"),
                DB::raw('users.id as related_id')
            )
            ->whereNotNull('users.user_type')
            ->where('users.user_type', '!=', '');
    }
    
    private function getPatientUserQuery(): Builder
    {
        return DB::table('users')
            ->leftJoin('branches', 'users.branch_id', '=', 'branches.id')
            ->select(
                'users.id',
                'users.first_name',
                'users.last_name',
                'users.email',
                'users.role_as',
                DB::raw("NULL as user_type"),
                'users.branch_id',
                DB::raw('COALESCE(branches.center_name, "Not Assigned") as center_name'),
                DB::raw('COALESCE(users.phone, "N/A") as contact_number_mobile'),
                DB::raw("'patient_user' as id_type"),
                DB::raw('users.id as related_id')
            )
            ->where('users.role_as', '=', 6);
    }
}
