<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\InvoiceRepositoryInterface;
use App\Models\Invoice;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

class InvoiceRepository extends BaseRepository implements InvoiceRepositoryInterface
{
    public function __construct(Invoice $model)
    {
        parent::__construct($model);
    }

    public function getPendingByCenter(int $centerId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->pending()
            ->where('center_id', $centerId)
            ->with('patient')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getByPaymentStatus(string $status, int $centerId): Collection
    {
        return $this->model->where('payment_status', $status)
            ->where('center_id', $centerId)
            ->with('patient')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getByPatient(int $patientId): Collection
    {
        return $this->model->where('patient_id', $patientId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findWithPayments(int $id): ?Invoice
    {
        return $this->model->with(['payments', 'patient', 'session'])
            ->find($id);
    }

    public function getByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): Collection
    {
        return $this->model->dateRange($startDate, $endDate)
            ->where('center_id', $centerId)
            ->with('patient')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getOverdue(int $centerId): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->whereIn('payment_status', ['pending', 'partially_paid'])
            ->where('created_at', '<', now()->subDays(30))
            ->with('patient')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function getTotalRevenue(int $centerId, Carbon $startDate, Carbon $endDate): float
    {
        return $this->model->where('center_id', $centerId)
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('total_amount');
    }

    public function findBySession(int $sessionId): ?Invoice
    {
        return $this->model->where('session_id', $sessionId)->first();
    }
}
