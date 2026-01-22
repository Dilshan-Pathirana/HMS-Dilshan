<?php

namespace App\Services\PurchasingBills;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class CreateProductPurchasingBill
{
    public static function create(Collection $billItem): array
    {
        $billDetail = $billItem->first();

        Log::info($billDetail->net_total);

        return [
            'bill_id' => $billDetail->bill_id,
            'user_id' => $billDetail->user_id,
            'invoice_id' => $billDetail->invoice_id,
            'discount_amount' => $billDetail->discount_amount,
            'total_amount' => $billDetail->total_amount,
            'net_total' => $billDetail->net_total,
            'amount_received' => $billDetail->amount_received,
            'remain_amount' => $billDetail->remain_amount,
            'products' => $billItem->map(fn ($item) => [
                'purchase_product_id' => $item->purchase_product_id,
                'qty' => $item->qty,
                'price' => $item->price,
                'item_code' => $item->item_code,
                'item_name' => $item->item_name,
                'generic_name' => $item->generic_name,
                'brand_name' => $item->brand_name,
                'category' => $item->category,
            ])->values()->toArray(),
        ];
    }
}
