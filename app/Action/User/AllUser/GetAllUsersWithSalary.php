<?php

namespace App\Action\User\AllUser;

use Carbon\Carbon;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Query\Builder;

class GetAllUsersWithSalary
{
    public function __invoke(): array
    {
        try {
            $roles = [
                'cashiers'    => 'cashier_id',
                'doctors'     => 'doctor_id',
                'nurses'      => 'nurse_id',
                'pharmacists' => 'pharmacist_id',
            ];

            $queries = [];

            foreach ($roles as $table => $idAlias) {
                $queries[] = $this->getUserQueryWithSalary($table, $idAlias);
            }

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

    private function getUserQueryWithSalary(string $table, string $idAlias): Builder
    {
        $currentMonth = Carbon::now()->format('Y-m');

        return DB::table($table)
            ->join('users', "{$table}.user_id", '=', 'users.id')
            ->join('branches', "{$table}.branch_id", '=', 'branches.id')
            ->leftJoin('staff_salary', "{$table}.user_id", '=', 'staff_salary.user_id')
            ->leftJoin('employee_ot', function ($join) use ($currentMonth, $table) {
                $join->on('employee_ot.employee_id', '=', "{$table}.user_id")
                    ->whereRaw('DATE_FORMAT(employee_ot.created_at, "%Y-%m") = ?', [$currentMonth]);
            })
            ->whereNotNull('staff_salary.maximum_hours_can_work')
            ->select(
                'users.id',
                'users.role_as',
                DB::raw("{$table}.id as {$idAlias}"),
                "{$table}.branch_id",
                'branches.center_name as center_name',
                "{$table}.contact_number_mobile",
                'users.email',
                'users.first_name',
                'users.last_name',
                'staff_salary.basic_salary_amount',
                'staff_salary.allocation_amount',
                'staff_salary.rate_for_hour',
                'staff_salary.maximum_hours_can_work',
                DB::raw('SUM(employee_ot.hours_worked) as total_hours_worked_current_month')
            )
            ->groupBy(
                'users.id',
                'users.role_as',
                "{$table}.id",
                "{$table}.branch_id",
                'branches.center_name',
                "{$table}.contact_number_mobile",
                'users.email',
                'users.first_name',
                'users.last_name',
                'staff_salary.basic_salary_amount',
                'staff_salary.allocation_amount',
                'staff_salary.rate_for_hour',
                'staff_salary.maximum_hours_can_work'
            );
    }
}
