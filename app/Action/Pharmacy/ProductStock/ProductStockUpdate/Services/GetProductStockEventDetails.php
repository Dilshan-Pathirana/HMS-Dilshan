<?php

namespace App\Action\Pharmacy\ProductStock\ProductStockUpdate\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GetProductStockEventDetails
{
    public static function execute(int $eventType): Collection
    {
        return DB::table('product_event_details')
            ->join('products', 'product_event_details.product_id', '=', 'products.id')
            ->select(
                'product_event_details.id',
                'product_event_details.product_id',
                'product_event_details.user_id',
                'product_event_details.previous_stock',
                'product_event_details.stock_related_to_event',
                'product_event_details.current_stock',
                'product_event_details.event_type',
                'product_event_details.event_reason',
                'products.item_name',
                'products.item_code'
            )
            ->where('product_event_details.event_type', $eventType)
            ->get();
    }
}
