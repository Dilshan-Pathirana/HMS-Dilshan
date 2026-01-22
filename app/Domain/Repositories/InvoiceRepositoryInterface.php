<?php

namespace App\Domain\Repositories;

use App\Models\Invoice;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

interface InvoiceRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get pending invoices for center
     */
    public function getPendingByCenter(int $centerId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get invoices by payment status
     */
    public function getByPaymentStatus(string $status, int $centerId): Collection;

    /**
     * Get invoices for patient
     */
    public function getByPatient(int $patientId): Collection;

    /**
     * Get invoice with payments
     */
    public function findWithPayments(int $id): ?Invoice;

    /**
     * Get invoices within date range
     */
    public function getByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): Collection;

    /**
     * Get overdue invoices
     */
    public function getOverdue(int $centerId): Collection;

    /**
     * Get total revenue by date range
     */
    public function getTotalRevenue(int $centerId, Carbon $startDate, Carbon $endDate): float;

    /**
     * Find invoice by session
     */
    public function findBySession(int $sessionId): ?Invoice;
}
