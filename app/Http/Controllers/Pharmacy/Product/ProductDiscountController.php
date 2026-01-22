<?php

namespace App\Http\Controllers\Pharmacy\Product;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\Pharmacy\Product\CreateProductDiscount;
use App\Action\Pharmacy\Product\DeleteProductDiscount;
use App\Action\Pharmacy\Product\GetAllProductDiscountDetails;
use App\Http\Requests\Pharmacy\Product\ProductDiscountCreateRequest;

class ProductDiscountController extends Controller
{
    public function addProductDiscount(ProductDiscountCreateRequest $request, CreateProductDiscount $createProductDiscount): JsonResponse
    {
        $validatedProductDiscountCreateRequest = $request->validated();

        if ($validatedProductDiscountCreateRequest) {
            return response()->json($createProductDiscount($validatedProductDiscountCreateRequest));
        }

        return response()->json();
    }

    public function getProductsDiscounts(GetAllProductDiscountDetails $getAllProductDiscountDetails): JsonResponse
    {
        return response()->json($getAllProductDiscountDetails());
    }

    public function removeProductDiscount(string $productId, DeleteProductDiscount $deleteProductDiscount): JsonResponse
    {
        return response()->json($deleteProductDiscount($productId));
    }
}
