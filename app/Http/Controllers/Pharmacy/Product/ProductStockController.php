<?php

namespace App\Http\Controllers\Pharmacy\Product;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pharmacy\Product\ProductStockUpdateRequest;
use App\Http\Requests\Pharmacy\Product\ProductStockDamageReduceRequest;
use App\Http\Requests\Pharmacy\Product\ProductTransferStockReduceRequest;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\ProductStockUpdate;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\GetProductRenewStock;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\GetProductDamagedStock;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\GetProductTransferStock;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\ProductDamagedStockReduce;
use App\Action\Pharmacy\ProductStock\ProductStockUpdate\ProductTransferStockReduce;

class ProductStockController extends Controller
{
    public function updateProductStock(
        ProductStockUpdateRequest $request,
        ProductStockUpdate $productStockUpdate
    ): JsonResponse {
        $validatedProductStockUpdateRequest = $request->validated();

        if ($validatedProductStockUpdateRequest) {
            return response()->json($productStockUpdate($validatedProductStockUpdateRequest));
        }

        return response()->json([]);
    }

    public function reduceProductDamagedStock(
        ProductStockDamageReduceRequest $request,
        ProductDamagedStockReduce $productDamagedStockReduce,
    ): JsonResponse {
        $validatedProductDamagedStockRequest = $request->validated();

        if ($validatedProductDamagedStockRequest) {
            return response()->json($productDamagedStockReduce($validatedProductDamagedStockRequest));
        }

        return response()->json([]);
    }

    public function reduceProductTransferStock(
        ProductTransferStockReduce $productTransferStockReduce,
        ProductTransferStockReduceRequest $request
    ): JsonResponse {
        $validatedProductTransferRequest = $request->validated();

        if ($validatedProductTransferRequest) {
            return response()->json($productTransferStockReduce($validatedProductTransferRequest));
        }

        return response()->json([]);
    }

    public function getProductDamagedStock(GetProductDamagedStock $getProductDamagedStock): JsonResponse
    {
        return response()->json($getProductDamagedStock());
    }

    public function getProductTransferStock(GetProductTransferStock $getProductTransferStock): JsonResponse
    {
        return response()->json($getProductTransferStock());
    }

    public function getProductRenewStock(GetProductRenewStock $getProductRenewStock): JsonResponse
    {
        return response()->json($getProductRenewStock());
    }
}
