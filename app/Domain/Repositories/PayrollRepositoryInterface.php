<?php

namespace App\Domain\Repositories;

use App\Models\Payroll;
use Illuminate\Support\Collection;

interface PayrollRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Find payroll by employee and period
     */
    public function findByEmployeeAndPeriod(int $employeeId, string $period): ?Payroll;

    /**
     * Get pending payrolls for center
     */
    public function getPendingByCenter(int $centerId): Collection;

    /**
     * Get payrolls by period
     */
    public function getByPeriod(string $period, int $centerId): Collection;

    /**
     * Get payroll with disbursement
     */
    public function findWithDisbursement(int $id): ?Payroll;

    /**
     * Mark as disbursed
     */
    public function markAsDisbursed(int $id): bool;

    /**
     * Get total payroll cost for period
     */
    public function getTotalCostByPeriod(int $centerId, string $period): float;

    /**
     * Get payroll summary by employee
     */
    public function getSummaryByEmployee(int $employeeId): Collection;
}
