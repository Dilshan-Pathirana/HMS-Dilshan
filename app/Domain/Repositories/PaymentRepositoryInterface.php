<?php

namespace App\Domain\Repositories;

use App\Models\Payment;
use Illuminate\Support\Collection;
use Carbon\Carbon;

interface PaymentRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get payments by invoice
     */
    public function getByInvoice(int $invoiceId): Collection;

    /**
     * Get payments by method
     */
    public function getByMethod(string $method, int $centerId, Carbon $startDate, Carbon $endDate): Collection;

    /**
     * Get payments within date range
     */
    public function getByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): Collection;

    /**
     * Get total payments by date range
     */
    public function getTotalByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): float;

    /**
     * Get payments by patient
     */
    public function getByPatient(int $patientId): Collection;

    /**
     * Get payment with invoice details
     */
    public function findWithInvoice(int $id): ?Payment;

    /**
     * Get daily collection report
     */
    public function getDailyCollection(int $centerId, Carbon $date): Collection;
}
