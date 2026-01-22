<?php

namespace App\Http\Controllers\Pharmacy\Purchasing;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\Pharmacy\CreatePurchasing;
use App\Action\Pharmacy\PurchasingCreate\GetAllPurchasing;
use App\Http\Requests\Pharmacy\Purchasing\PurchasingCreateRequest;
use App\Action\Pharmacy\PurchasingCreate\RetrievePurchasingDetails;

class PurchasingController extends Controller
{
    public function addPurchasing(PurchasingCreateRequest $request, CreatePurchasing $createPurchasing): JsonResponse
    {
        $validatedPurchasingCreateRequest = $request->validated();

        if ($validatedPurchasingCreateRequest) {
            return response()->json($createPurchasing($validatedPurchasingCreateRequest));
        }

        return response()->json();
    }

    public function getPurchasingDetails(GetAllPurchasing $getAllPurchasing): JsonResponse
    {
        return response()->json($getAllPurchasing());
    }

    public function fetchPurchasingDetails(Request $request, RetrievePurchasingDetails $retrievePurchasingDetails): JsonResponse
    {
        $filters = $request->only(['date', 'year', 'month']);
        $data = $retrievePurchasingDetails($filters);

        return response()->json($data);
    }
}
