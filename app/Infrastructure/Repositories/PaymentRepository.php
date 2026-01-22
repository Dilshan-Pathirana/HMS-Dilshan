<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\PaymentRepositoryInterface;
use App\Models\Payment;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class PaymentRepository extends BaseRepository implements PaymentRepositoryInterface
{
    public function __construct(Payment $model)
    {
        parent::__construct($model);
    }

    public function getByInvoice(int $invoiceId): Collection
    {
        return $this->model->where('invoice_id', $invoiceId)
            ->orderBy('payment_date', 'desc')
            ->get();
    }

    public function getByMethod(string $method, int $centerId, Carbon $startDate, Carbon $endDate): Collection
    {
        return $this->model->where('payment_method', $method)
            ->where('center_id', $centerId)
            ->whereBetween('payment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->with('invoice.patient')
            ->orderBy('payment_date', 'desc')
            ->get();
    }

    public function getByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->whereBetween('payment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->with('invoice.patient')
            ->orderBy('payment_date', 'desc')
            ->get();
    }

    public function getTotalByDateRange(int $centerId, Carbon $startDate, Carbon $endDate): float
    {
        return $this->model->where('center_id', $centerId)
            ->where('status', 'completed')
            ->whereBetween('payment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('amount');
    }

    public function getByPatient(int $patientId): Collection
    {
        return $this->model->where('patient_id', $patientId)
            ->with('invoice')
            ->orderBy('payment_date', 'desc')
            ->get();
    }

    public function findWithInvoice(int $id): ?Payment
    {
        return $this->model->with(['invoice.patient', 'processedBy'])
            ->find($id);
    }

    public function getDailyCollection(int $centerId, Carbon $date): Collection
    {
        return $this->model->where('center_id', $centerId)
            ->where('payment_date', $date->toDateString())
            ->where('status', 'completed')
            ->with(['invoice.patient', 'processedBy'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
