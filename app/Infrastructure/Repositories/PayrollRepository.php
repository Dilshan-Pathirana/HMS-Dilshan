<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\PayrollRepositoryInterface;
use App\Models\Payroll;
use Illuminate\Support\Collection;

class PayrollRepository extends BaseRepository implements PayrollRepositoryInterface
{
    public function __construct(Payroll $model)
    {
        parent::__construct($model);
    }

    public function findByEmployeeAndPeriod(int $employeeId, string $period): ?Payroll
    {
        return $this->model->where('employee_id', $employeeId)
            ->where('period', $period)
            ->first();
    }

    public function getPendingByCenter(int $centerId): Collection
    {
        return $this->model->pending()
            ->where('center_id', $centerId)
            ->with('employee')
            ->orderBy('period', 'desc')
            ->get();
    }

    public function getByPeriod(string $period, int $centerId): Collection
    {
        return $this->model->byPeriod($period)
            ->where('center_id', $centerId)
            ->with('employee')
            ->get();
    }

    public function findWithDisbursement(int $id): ?Payroll
    {
        return $this->model->with(['employee', 'disbursement'])
            ->find($id);
    }

    public function markAsDisbursed(int $id): bool
    {
        return $this->model->find($id)->update([
            'status' => 'disbursed',
            'disbursed_at' => now()
        ]);
    }

    public function getTotalCostByPeriod(int $centerId, string $period): float
    {
        return $this->model->where('center_id', $centerId)
            ->where('period', $period)
            ->sum('net_salary');
    }

    public function getSummaryByEmployee(int $employeeId): Collection
    {
        return $this->model->where('employee_id', $employeeId)
            ->orderBy('period', 'desc')
            ->get();
    }
}
