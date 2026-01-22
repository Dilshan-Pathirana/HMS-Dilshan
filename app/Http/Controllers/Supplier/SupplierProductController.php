<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Pharmacy\Supplier;
use Illuminate\Support\Facades\Auth;

class SupplierProductController extends Controller
{
    /**
     * Get all products offered by supplier
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $supplier = Supplier::where('user_id', $user->id)->first();

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier profile not found'
                ], 404);
            }

            // Get products supplied info
            $productsSupplied = $supplier->products_supplied 
                ? explode(',', $supplier->products_supplied) 
                : [];

            return response()->json([
                'success' => true,
                'data' => [
                    'products_supplied' => $productsSupplied,
                    'supplier_info' => [
                        'name' => $supplier->supplier_name,
                        'type' => $supplier->supplier_type,
                        'rating' => $supplier->rating
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load products: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add new product to supplier's catalog
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $supplier = Supplier::where('user_id', $user->id)->first();

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier profile not found'
                ], 404);
            }

            $validated = $request->validate([
                'product_name' => 'required|string|max:255'
            ]);

            // Add product to products_supplied list
            $currentProducts = $supplier->products_supplied 
                ? explode(',', $supplier->products_supplied) 
                : [];
            
            $currentProducts[] = trim($validated['product_name']);
            $supplier->products_supplied = implode(', ', array_unique($currentProducts));
            $supplier->save();

            return response()->json([
                'success' => true,
                'message' => 'Product added successfully',
                'data' => $supplier
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add product: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update product information
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Product update functionality will be implemented here'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific product details
     */
    public function show(Request $request, $id): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Product details will be shown here'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load product: ' . $e->getMessage()
            ], 500);
        }
    }
}
