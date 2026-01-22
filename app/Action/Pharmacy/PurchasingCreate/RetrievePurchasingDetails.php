<?php

namespace App\Action\Pharmacy\PurchasingCreate;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\PurchasingBills\CreateProductPurchasingBill;

class RetrievePurchasingDetails
{
    public function __invoke(array $filters = []): array
    {
        try {
            $billIdsQuery = DB::table('daily_bills')->select('id');

            if (isset($filters['date'])) {
                $billIdsQuery->whereDate('created_at', $filters['date']);
            }

            if (isset($filters['year'])) {
                $billIdsQuery->whereYear('created_at', $filters['year']);
            }

            if (isset($filters['month'])) {
                $billIdsQuery->whereMonth('created_at', $filters['month']);
            }

            $billIds = $billIdsQuery->pluck('id');

            if ($billIds->isEmpty()) {
                return CommonResponse::sendSuccessResponseWithData('purchasing', (object) []);
            }

            $query = DB::table('daily_purchase_products')
                ->join('products', 'daily_purchase_products.product_id', '=', 'products.id')
                ->join('daily_bills', 'daily_purchase_products.bill_id', '=', 'daily_bills.id')
                ->select(
                    'daily_bills.id as bill_id',
                    'daily_bills.invoice_id',
                    'daily_bills.user_id',
                    'daily_bills.discount_amount',
                    'daily_bills.total_amount',
                    'daily_bills.net_total',
                    'daily_bills.amount_received',
                    'daily_bills.remain_amount',
                    'daily_purchase_products.id as purchase_product_id',
                    'daily_purchase_products.qty',
                    'daily_purchase_products.price',
                    'products.item_code',
                    'products.item_name',
                    'products.generic_name',
                    'products.brand_name',
                    'products.category',
                    'daily_bills.created_at'
                )
                ->whereIn('daily_bills.id', $billIds);

            $purchasing = $query->get()
                ->groupBy('bill_id')
                ->map(fn ($billItem) => CreateProductPurchasingBill::create($billItem))
                ->values()
                ->toArray();

            return CommonResponse::sendSuccessResponseWithData('purchasing', (object) $purchasing);
        } catch (\Exception $exception) {
            Log::error($exception->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
