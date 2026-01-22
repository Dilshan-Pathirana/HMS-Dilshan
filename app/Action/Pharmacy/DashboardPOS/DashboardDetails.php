<?php

namespace App\Action\Pharmacy\DashboardPOS;

use Exception;
use Illuminate\Support\Carbon;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Purchasing\DailyBill;

class DashboardDetails
{
    public function __invoke(): array
    {
        try {
            $totalSales = $this->dailyTransactionAmount();
            $totalProductCount = $this->getTotalProductCount();

            $data = [
                'total_sales' => number_format($totalSales, 2, '.', ''),
                'total_products' => $totalProductCount,
            ];

            return CommonResponse::sendSuccessResponseWithData('dashboard_details', (object) $data);
        } catch (Exception $exception) {
            Log::error('Error fetching dashboard details: '.$exception->getMessage(), [
                'exception' => $exception,
            ]);

            return CommonResponse::sendBadResponse();
        }
    }

    private function dailyTransactionAmount(): float
    {
        return DailyBill::whereDate('created_at', Carbon::today())
            ->sum('total_amount');
    }

    private function getTotalProductCount(): int
    {
        return DB::table('products')->count();
    }
}
