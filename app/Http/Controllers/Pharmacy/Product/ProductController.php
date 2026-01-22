<?php

namespace App\Http\Controllers\Pharmacy\Product;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Action\Pharmacy\Product\CreateProduct;
use App\Action\Pharmacy\Product\GetAllProducts;
use App\Action\Pharmacy\ProductDelete\ProductDelete;
use App\Action\Pharmacy\ProductUpdate\UpdateExistingProduct;
use App\Http\Requests\Pharmacy\Product\ProductCreateRequest;
use App\Http\Requests\Pharmacy\Product\ProductUpdateRequest;
use App\Action\Pharmacy\Product\GetAllProductItemNameAndCode;

class ProductController extends Controller
{
    public function addProduct(ProductCreateRequest $request, CreateProduct $createProduct): JsonResponse
    {
        $validatedProductCreateRequest = $request->validated();

        if ($validatedProductCreateRequest) {
            return response()->json($createProduct($validatedProductCreateRequest));
        }

        return response()->json();
    }

    public function getProductsDetails(GetAllProducts $getAllProducts): JsonResponse
    {
        return response()->json($getAllProducts());
    }

    public function updateProduct(
        string $productId,
        ProductUpdateRequest $request,
        UpdateExistingProduct $updateExistingProduct
    ): JsonResponse {
        try {
            $validatedProductUpdateRequest = $request->validated();

            if ($validatedProductUpdateRequest) {
                $response = $updateExistingProduct($productId, $validatedProductUpdateRequest);

                return response()->json($response);
            }

            return response()->json(['message' => 'No valid data provided'], 400);
        } catch (Exception $exception) {
            Log::error($exception->getMessage());

            return response()->json(['message' => 'An error occurred while updating the product'], 500);
        }
    }

    public function getProductItemNameAndCode(GetAllProductItemNameAndCode $getAllProductItemNameAndCode): JsonResponse
    {
        return response()->json($getAllProductItemNameAndCode());
    }

    public function deleteProduct(string $productId, ProductDelete $productDelete): JsonResponse
    {
        if ($productId) {
            return response()->json($productDelete($productId));
        }

        return response()->json([]);
    }

    /**
     * Search products for POS billing by name or code
     * Filters by authenticated user's branch for cashiers
     */
    public function searchProducts(): JsonResponse
    {
        try {
            $query = request()->query('q', '');
            $branchId = request()->query('branch_id') ?? auth()->user()->branch_id ?? null;
            
            if (strlen($query) < 2) {
                return response()->json([]);
            }

            $products = \DB::table('products')
                ->join('products_stock', 'products.id', '=', 'products_stock.product_id')
                ->select(
                    'products.id',
                    'products.item_name',
                    'products.item_code',
                    'products_stock.unit_selling_price as selling_price',
                    'products_stock.unit_cost as buying_price',
                    \DB::raw('COALESCE(products_stock.current_stock, 0) as stock')
                )
                ->where(function($q) use ($query) {
                    $q->where('products.item_name', 'LIKE', "%{$query}%")
                      ->orWhere('products.item_code', 'LIKE', "%{$query}%");
                })
                ->where('products_stock.current_stock', '>', 0)
                ->where('products_stock.unit_selling_price', '>', 0);

            // Filter by branch if available
            if ($branchId) {
                $products->where('products_stock.branch_id', $branchId);
            }

            $results = $products->limit(15)->get();

            return response()->json($results);
        } catch (\Exception $exception) {
            Log::error('Error searching products: '.$exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json(['status' => 500, 'message' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Get all available inventory items for POS display
     * Supports branch_id filter for Super Admin
     * For cashiers, filters by the authenticated user's branch
     */
    public function getInventoryList(Request $request): JsonResponse
    {
        try {
            // First check if branch_id is passed as a query parameter
            $branchId = $request->query('branch_id');
            
            // If not passed, get from authenticated user (for cashiers)
            if (!$branchId) {
                $branchId = auth()->user()->branch_id ?? null;
            }
            
            $query = \DB::table('products')
                ->join('products_stock', 'products.id', '=', 'products_stock.product_id')
                ->select(
                    'products.id',
                    'products.item_name',
                    'products.item_code',
                    'products.category',
                    'products_stock.unit_selling_price as selling_price',
                    'products_stock.unit_cost as buying_price',
                    \DB::raw('COALESCE(products_stock.current_stock, 0) as stock')
                )
                ->where('products_stock.current_stock', '>', 0);
            
            // Strictly filter by branch_id when available
            if ($branchId) {
                $query->where('products_stock.branch_id', $branchId);
            }
            
            $products = $query->orderBy('products.item_name')
                ->limit(100)
                ->get();

            return response()->json($products);
        } catch (\Exception $exception) {
            Log::error('Error loading inventory list: '.$exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json(['status' => 500, 'message' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Get products with branch-specific stock data
     */
    public function getProductsWithBranchStock(): JsonResponse
    {
        try {
            $branchId = request()->query('branch_id');
            
            $query = \DB::table('products')
                ->leftJoin('suppliers', 'products.supplier_id', '=', 'suppliers.id')
                ->leftJoin('warranty', 'products.id', '=', 'warranty.product_id');
            
            // If branch_id is specified, get branch-specific stock
            if ($branchId) {
                $query->leftJoin('products_stock', function ($join) use ($branchId) {
                    $join->on('products.id', '=', 'products_stock.product_id')
                         ->where('products_stock.branch_id', '=', $branchId);
                });
            } else {
                // Get default stock (no branch_id or NULL)
                $query->leftJoin('products_stock', function ($join) {
                    $join->on('products.id', '=', 'products_stock.product_id')
                         ->whereNull('products_stock.branch_id');
                });
            }

            $query->leftJoin('product_discount', 'products.id', '=', 'product_discount.product_id');

            $products = $query->select(
                'products.id',
                'products.supplier_id',
                'suppliers.supplier_name',
                'products.item_code',
                'products.barcode',
                'products.item_name',
                'products.generic_name',
                'products.brand_name',
                'products.category',
                'products_stock.id as stock_id',
                'products_stock.branch_id',
                'products_stock.unit',
                'products_stock.current_stock',
                'products_stock.min_stock',
                'products_stock.reorder_level',
                'products_stock.reorder_quantity',
                'products_stock.unit_cost',
                'products_stock.entry_date as date_of_entry',
                'products_stock.unit_selling_price',
                'products_stock.expiry_date',
                'products_stock.stock_status',
                'products_stock.product_store_location',
                'products_stock.stock_update_date',
                'products_stock.damaged_stock as damaged_unit',
                'warranty.warranty_serial',
                'warranty.warranty_duration',
                'warranty.warranty_type',
                'product_discount.discount_type',
                'product_discount.discount_amount',
                'product_discount.discount_percentage'
            )->get();

            return response()->json([
                'status' => 200,
                'products' => $products,
                'branch_id' => $branchId
            ]);
        } catch (\Exception $exception) {
            Log::error('Error loading products with branch stock: ' . $exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json(['status' => 500, 'message' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Update or create branch-specific stock for a product
     */
    public function updateBranchStock(string $productId): JsonResponse
    {
        try {
            $branchId = request()->input('branch_id');
            $data = request()->only([
                'unit', 'current_stock', 'min_stock', 'reorder_level', 'reorder_quantity',
                'unit_cost', 'unit_selling_price', 'expiry_date', 'product_store_location'
            ]);

            // Check if branch-specific stock record exists
            $existingStock = \DB::table('products_stock')
                ->where('product_id', $productId)
                ->where('branch_id', $branchId)
                ->first();

            if ($existingStock) {
                // Update existing record
                \DB::table('products_stock')
                    ->where('id', $existingStock->id)
                    ->update(array_merge($data, [
                        'stock_update_date' => now(),
                        'updated_at' => now()
                    ]));
                
                $message = 'Branch stock updated successfully';
            } else {
                // Create new branch-specific stock record
                // First, get default values from the base stock record
                $baseStock = \DB::table('products_stock')
                    ->where('product_id', $productId)
                    ->whereNull('branch_id')
                    ->first();

                $newData = [
                    'id' => \Str::uuid()->toString(),
                    'product_id' => $productId,
                    'branch_id' => $branchId,
                    'unit' => $data['unit'] ?? ($baseStock->unit ?? 'pcs'),
                    'current_stock' => $data['current_stock'] ?? 0,
                    'min_stock' => $data['min_stock'] ?? ($baseStock->min_stock ?? 0),
                    'reorder_level' => $data['reorder_level'] ?? ($baseStock->reorder_level ?? 10),
                    'reorder_quantity' => $data['reorder_quantity'] ?? ($baseStock->reorder_quantity ?? 50),
                    'unit_cost' => $data['unit_cost'] ?? ($baseStock->unit_cost ?? 0),
                    'unit_selling_price' => $data['unit_selling_price'] ?? ($baseStock->unit_selling_price ?? 0),
                    'expiry_date' => $data['expiry_date'] ?? ($baseStock->expiry_date ?? null),
                    'product_store_location' => $data['product_store_location'] ?? '',
                    'stock_status' => 'active',
                    'entry_date' => now(),
                    'stock_update_date' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ];

                \DB::table('products_stock')->insert($newData);
                $message = 'Branch stock created successfully';
            }

            return response()->json([
                'status' => 200,
                'message' => $message
            ]);
        } catch (\Exception $exception) {
            Log::error('Error updating branch stock: ' . $exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json(['status' => 500, 'message' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Get all branches with their stock status for a product
     */
    public function getProductBranchStock(string $productId): JsonResponse
    {
        try {
            // Get product info
            $product = \DB::table('products')->where('id', $productId)->first();
            
            if (!$product) {
                return response()->json(['status' => 404, 'message' => 'Product not found'], 404);
            }

            // Get all branches
            $branches = \DB::table('branches')
                ->select('id', 'center_name', 'city')
                ->orderBy('center_name')
                ->get();

            // Get stock records for this product
            $stockRecords = \DB::table('products_stock')
                ->where('product_id', $productId)
                ->get()
                ->keyBy('branch_id');

            // Merge branch and stock data
            $branchStock = $branches->map(function ($branch) use ($stockRecords) {
                $stock = $stockRecords->get($branch->id);
                return [
                    'branch_id' => $branch->id,
                    'branch_name' => $branch->center_name,
                    'city' => $branch->city,
                    'has_stock' => $stock !== null,
                    'stock_id' => $stock?->id,
                    'current_stock' => $stock?->current_stock ?? 0,
                    'unit' => $stock?->unit ?? 'pcs',
                    'unit_cost' => $stock?->unit_cost ?? 0,
                    'unit_selling_price' => $stock?->unit_selling_price ?? 0,
                    'min_stock' => $stock?->min_stock ?? 0,
                    'reorder_level' => $stock?->reorder_level ?? 10,
                    'expiry_date' => $stock?->expiry_date,
                    'product_store_location' => $stock?->product_store_location ?? '',
                ];
            });

            // Also get default stock (no branch)
            $defaultStock = $stockRecords->get(null);

            return response()->json([
                'status' => 200,
                'product' => [
                    'id' => $product->id,
                    'item_name' => $product->item_name,
                    'item_code' => $product->item_code,
                    'category' => $product->category,
                ],
                'default_stock' => $defaultStock ? [
                    'stock_id' => $defaultStock->id,
                    'current_stock' => $defaultStock->current_stock ?? 0,
                    'unit' => $defaultStock->unit ?? 'pcs',
                    'unit_cost' => $defaultStock->unit_cost ?? 0,
                    'unit_selling_price' => $defaultStock->unit_selling_price ?? 0,
                    'min_stock' => $defaultStock->min_stock ?? 0,
                    'reorder_level' => $defaultStock->reorder_level ?? 10,
                ] : null,
                'branch_stock' => $branchStock
            ]);
        } catch (\Exception $exception) {
            Log::error('Error loading product branch stock: ' . $exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json(['status' => 500, 'message' => 'Internal Server Error'], 500);
        }
    }
}
