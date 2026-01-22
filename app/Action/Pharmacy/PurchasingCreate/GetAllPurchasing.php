<?php

namespace App\Action\Pharmacy\PurchasingCreate;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\PurchasingBills\CreateProductPurchasingBill;

class GetAllPurchasing
{
    public function __invoke(): array
    {
        try {
            $purchasing = DB::table('daily_bills')
                ->join('daily_purchase_products', 'daily_bills.id', '=', 'daily_purchase_products.bill_id')
                ->join('products', 'daily_purchase_products.product_id', '=', 'products.id')
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
                    'products.category'
                )
                ->get()
                ->groupBy('bill_id')
                ->map(fn ($billItem) => CreateProductPurchasingBill::create($billItem))
                ->values();

            return CommonResponse::sendSuccessResponseWithData('purchasing', $purchasing);
        } catch (\Exception $exception) {
            Log::error($exception->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
