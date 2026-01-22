<?php

namespace App\Action\Pharmacy\Product;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;

class GetAllProducts
{
    public function __invoke(): array
    {
        try {
            // First, get all products
            $productsQuery = DB::table('products')
                ->leftJoin('suppliers', 'products.supplier_id', '=', 'suppliers.id')
                ->select(
                    'products.id',
                    'products.supplier_id',
                    'suppliers.supplier_name',
                    'products.item_code',
                    'products.barcode',
                    'products.item_name',
                    'products.generic_name',
                    'products.brand_name',
                    'products.category'
                )
                ->get();

            // Get stock data for each product (prefer NULL branch_id, otherwise first record)
            $stockData = DB::table('products_stock')
                ->select('*')
                ->orderByRaw('CASE WHEN branch_id IS NULL THEN 0 ELSE 1 END')
                ->get()
                ->groupBy('product_id');

            // Get warranty data
            $warrantyData = DB::table('warranty')
                ->get()
                ->keyBy('product_id');

            // Get discount data
            $discountData = DB::table('product_discount')
                ->get()
                ->keyBy('product_id');

            // Combine all data
            $products = $productsQuery->map(function($product) use ($stockData, $warrantyData, $discountData) {
                $stock = $stockData->get($product->id)?->first();
                $warranty = $warrantyData->get($product->id);
                $discount = $discountData->get($product->id);

                return (object) [
                    'id' => $product->id,
                    'supplier_id' => $product->supplier_id,
                    'supplier_name' => $product->supplier_name,
                    'item_code' => $product->item_code,
                    'barcode' => $product->barcode,
                    'item_name' => $product->item_name,
                    'generic_name' => $product->generic_name,
                    'brand_name' => $product->brand_name,
                    'category' => $product->category,
                    'unit' => $stock?->unit,
                    'current_stock' => $stock?->current_stock ?? 0,
                    'min_stock' => $stock?->min_stock ?? 0,
                    'reorder_level' => $stock?->reorder_level,
                    'reorder_quantity' => $stock?->reorder_quantity,
                    'unit_cost' => $stock?->unit_cost ?? 0,
                    'date_of_entry' => $stock?->entry_date,
                    'unit_selling_price' => $stock?->unit_selling_price ?? 0,
                    'expiry_date' => $stock?->expiry_date,
                    'stock_status' => $stock?->stock_status,
                    'product_store_location' => $stock?->product_store_location,
                    'stock_update_date' => $stock?->stock_update_date,
                    'damaged_unit' => $stock?->damaged_stock,
                    'warranty_serial' => $warranty?->warranty_serial,
                    'warranty_duration' => $warranty?->warranty_duration,
                    'warranty_start_date' => $warranty?->warranty_start_date,
                    'warranty_end_date' => $warranty?->warranty_end_date,
                    'warranty_type' => $warranty?->warranty_type,
                    'discount_type' => $discount?->discount_type,
                    'discount_amount' => $discount?->discount_amount,
                    'discount_percentage' => $discount?->discount_percentage,
                ];
            });

            return CommonResponse::sendSuccessResponseWithData('products', $products);
        } catch (\Exception $exception) {
            \Log::error('GetAllProducts error: ' . $exception->getMessage());
            return CommonResponse::sendBadResponse();
        }
    }
}
