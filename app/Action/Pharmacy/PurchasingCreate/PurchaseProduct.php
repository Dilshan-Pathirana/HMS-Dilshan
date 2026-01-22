<?php

namespace App\Action\Pharmacy\PurchasingCreate;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\Purchasing\DailyPurchaseProduct;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\Services\ProductStockManagement;

class PurchaseProduct
{
    public static function execute(array $products, string $billId): void
    {
        DB::transaction(function () use ($products, $billId) {
            $productData = [];

            foreach ($products as $product) {
                $productData[] = [
                    'id' => Str::uuid(),
                    'product_id' => $product['product_id'],
                    'bill_id' => $billId,
                    'qty' => $product['qty'],
                    'discount_amount' => $product['discount_amount'] ?? null,
                    'price' => $product['price'],
                ];

                $productStockManagement = new ProductStockManagement($product['product_id']);
                $productStockManagement->reduceProductStock(
                    $product['qty'],
                    4,
                    'product purchase',
                );
            }

            DailyPurchaseProduct::insert($productData);
        });
    }
}
