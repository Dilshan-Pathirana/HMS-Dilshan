<?php

namespace App\Action\Pharmacy\Product;

use App\Models\Pharmacy\Product;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Pharmacy\ProductDiscount;

class CreateProductDiscount
{
    public function __invoke(array $discountDetails): array
    {
        $product = Product::find($discountDetails['product_id']);
        if (! $product) {
            return CommonResponse::sendBadResponseWithMessage('Product not found');
        }

        if ($this->checkDiscountAlreadyExistingForProduct($discountDetails['product_id'])) {
            return CommonResponse::sendBadResponseWithMessage('Discount already exists for this product');
        }

        DB::beginTransaction();
        try {
            ProductDiscount::create([
                'product_id' => $discountDetails['product_id'],
                'discount_type' => $discountDetails['discount_type'],
                'discount_amount' => $discountDetails['discount_amount'],
                'discount_percentage' => $discountDetails['discount_percentage'],
            ]);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Product Discount created successfully');
        } catch (\Exception $e) {
            Log::error('CreateDiscount Error: '.$e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }

    private function checkDiscountAlreadyExistingForProduct(string $productId): bool
    {
        return ProductDiscount::where('product_id', $productId)->exists();
    }
}
