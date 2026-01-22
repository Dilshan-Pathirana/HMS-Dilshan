<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PharmacyInventory;
use App\Models\PharmacyStockTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Action\Pharmacy\Inventory\CreatePharmacyInventoryStock;
use App\Http\Requests\Pharmacy\Inventory\PharmacyInventoryStoreRequest;

class PharmacyInventoryController extends Controller
{
    /**
     * Get all inventory or filter by pharmacy
     */
    public function index(Request $request): JsonResponse
    {
        $query = PharmacyInventory::with('pharmacy');

        // Filter by branch_id through pharmacy relationship
        if ($request->has('branch_id')) {
            $query->whereHas('pharmacy', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        if ($request->has('pharmacy_id')) {
            $query->where('pharmacy_id', $request->pharmacy_id);
        }

        if ($request->has('low_stock') && $request->low_stock) {
            $query->whereColumn('quantity_in_stock', '<=', 'reorder_level')
                  ->where('quantity_in_stock', '>', 0);
        }

        if ($request->has('out_of_stock') && $request->out_of_stock) {
            $query->where('quantity_in_stock', '=', 0);
        }

        if ($request->has('expiring') && $request->expiring) {
            $query->where('expiration_date', '<=', now()->addDays(30))
                  ->where('expiration_date', '>=', now());
        }

        if ($request->has('expired') && $request->expired) {
            $query->where('expiration_date', '<', now());
        }

        // Paginate results - 20 items per page
        $perPage = 20;
        $paginated = $query->paginate($perPage);

        $inventory = $paginated->getCollection()->map(function($item) {
            return [
                'id' => $item->id,
                'pharmacy_id' => $item->pharmacy_id,
                'medicine_name' => $item->medication_name,
                'generic_name' => $item->generic_name,
                'batch_number' => $item->batch_number,
                'quantity' => $item->quantity_in_stock,
                'unit' => $item->dosage_form,
                'unit_price' => $item->unit_cost,
                'expiry_date' => $item->expiration_date?->format('Y-m-d'),
                'supplier' => $item->supplier,
                'reorder_level' => $item->reorder_level,
                'created_at' => $item->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'inventory' => $inventory,
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'from' => $paginated->firstItem(),
                    'to' => $paginated->lastItem(),
                ]
            ],
        ]);
    }

    /**
     * Get inventory item details
     */
    public function show(string $id): JsonResponse
    {
        $item = PharmacyInventory::with(['pharmacy', 'transactions' => function($query) {
            $query->latest()->take(20);
        }])->find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Inventory item not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    /**
     * Add new inventory item
     */
    public function store(PharmacyInventoryStoreRequest $request, CreatePharmacyInventoryStock $createPharmacyInventoryStock): JsonResponse
    {
        $validatedRequest = $request->validated();

        if ($validatedRequest) {
            return response()->json($createPharmacyInventoryStock($validatedRequest));
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid request data',
        ], 422);
    }

    /**
     * Update inventory item
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $item = PharmacyInventory::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Inventory item not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'medication_name' => 'sometimes|string|max:100',
            'generic_name' => 'nullable|string|max:100',
            'dosage_form' => 'sometimes|string|max:50',
            'strength' => 'sometimes|string|max:50',
            'manufacturer' => 'nullable|string|max:100',
            'supplier' => 'nullable|string|max:100',
            'batch_number' => 'sometimes|string|max:50',
            'expiration_date' => 'sometimes|date',
            'reorder_level' => 'sometimes|integer|min:0',
            'unit_cost' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'storage_location' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $item->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Inventory item updated successfully',
            'data' => $item,
        ]);
    }

    /**
     * Adjust stock quantity
     */
    public function adjustStock(Request $request, string $id): JsonResponse
    {
        $item = PharmacyInventory::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Inventory item not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'transaction_type' => 'required|in:purchase,sale,return,adjustment,expired',
            'quantity' => 'required|integer',
            'unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'reference_number' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $quantityBefore = $item->quantity_in_stock;
            $quantity = $request->quantity;
            
            // For sales and expired, quantity should be negative
            if (in_array($request->transaction_type, ['sale', 'expired'])) {
                $quantity = -abs($quantity);
            }

            $quantityAfter = $quantityBefore + $quantity;

            if ($quantityAfter < 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient stock. Available: ' . $quantityBefore,
                ], 400);
            }

            // Update stock
            $item->update(['quantity_in_stock' => $quantityAfter]);

            // Record transaction
            PharmacyStockTransaction::create([
                'pharmacy_inventory_id' => $item->id,
                'pharmacy_id' => $item->pharmacy_id,
                'transaction_type' => $request->transaction_type,
                'quantity' => $quantity,
                'quantity_before' => $quantityBefore,
                'quantity_after' => $quantityAfter,
                'unit_price' => $request->unit_price,
                'total_amount' => abs($quantity) * $request->unit_price,
                'performed_by' => auth()->id(),
                'notes' => $request->notes,
                'reference_number' => $request->reference_number,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stock adjusted successfully',
                'data' => [
                    'item' => $item->fresh(),
                    'quantity_before' => $quantityBefore,
                    'quantity_after' => $quantityAfter,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust stock',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Transfer stock between pharmacies
     */
    public function transfer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from_pharmacy_id' => 'required|exists:pharmacies,id',
            'to_pharmacy_id' => 'required|exists:pharmacies,id|different:from_pharmacy_id',
            'inventory_item_id' => 'required|exists:pharmacy_inventory,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $sourceItem = PharmacyInventory::where('id', $request->inventory_item_id)
                ->where('pharmacy_id', $request->from_pharmacy_id)
                ->first();

            if (!$sourceItem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item not found in source pharmacy',
                ], 404);
            }

            if ($sourceItem->quantity_in_stock < $request->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient stock. Available: ' . $sourceItem->quantity_in_stock,
                ], 400);
            }

            // Reduce from source
            $sourceQuantityBefore = $sourceItem->quantity_in_stock;
            $sourceItem->update(['quantity_in_stock' => $sourceQuantityBefore - $request->quantity]);

            // Record source transaction
            PharmacyStockTransaction::create([
                'pharmacy_inventory_id' => $sourceItem->id,
                'pharmacy_id' => $request->from_pharmacy_id,
                'transaction_type' => 'transfer',
                'quantity' => -$request->quantity,
                'quantity_before' => $sourceQuantityBefore,
                'quantity_after' => $sourceQuantityBefore - $request->quantity,
                'unit_price' => $sourceItem->unit_cost,
                'total_amount' => $sourceItem->unit_cost * $request->quantity,
                'performed_by' => auth()->id(),
                'notes' => $request->notes,
                'related_pharmacy_id' => $request->to_pharmacy_id,
            ]);

            // Add to destination (or create if doesn't exist)
            $destItem = PharmacyInventory::where('pharmacy_id', $request->to_pharmacy_id)
                ->where('medication_name', $sourceItem->medication_name)
                ->where('batch_number', $sourceItem->batch_number)
                ->first();

            if ($destItem) {
                $destQuantityBefore = $destItem->quantity_in_stock;
                $destItem->update(['quantity_in_stock' => $destQuantityBefore + $request->quantity]);
            } else {
                $destItem = PharmacyInventory::create([
                    'pharmacy_id' => $request->to_pharmacy_id,
                    'medication_name' => $sourceItem->medication_name,
                    'generic_name' => $sourceItem->generic_name,
                    'dosage_form' => $sourceItem->dosage_form,
                    'strength' => $sourceItem->strength,
                    'manufacturer' => $sourceItem->manufacturer,
                    'supplier' => $sourceItem->supplier,
                    'batch_number' => $sourceItem->batch_number,
                    'expiration_date' => $sourceItem->expiration_date,
                    'quantity_in_stock' => $request->quantity,
                    'reorder_level' => $sourceItem->reorder_level,
                    'unit_cost' => $sourceItem->unit_cost,
                    'selling_price' => $sourceItem->selling_price,
                    'discount_percentage' => $sourceItem->discount_percentage,
                    'is_active' => true,
                ]);
                $destQuantityBefore = 0;
            }

            // Record destination transaction
            PharmacyStockTransaction::create([
                'pharmacy_inventory_id' => $destItem->id,
                'pharmacy_id' => $request->to_pharmacy_id,
                'transaction_type' => 'transfer',
                'quantity' => $request->quantity,
                'quantity_before' => $destQuantityBefore,
                'quantity_after' => $destQuantityBefore + $request->quantity,
                'unit_price' => $sourceItem->unit_cost,
                'total_amount' => $sourceItem->unit_cost * $request->quantity,
                'performed_by' => auth()->id(),
                'notes' => $request->notes,
                'related_pharmacy_id' => $request->from_pharmacy_id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stock transferred successfully',
                'data' => [
                    'source_item' => $sourceItem->fresh(),
                    'destination_item' => $destItem->fresh(),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to transfer stock',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete inventory item
     */
    public function destroy(string $id): JsonResponse
    {
        $item = PharmacyInventory::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Inventory item not found',
            ], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Inventory item deleted successfully',
        ]);
    }

    /**
     * Get stock transactions with optional filters
     */
    public function transactions(Request $request): JsonResponse
    {
        $query = PharmacyStockTransaction::with(['inventory.pharmacy', 'user']);

        // Filter by branch_id through pharmacy relationship
        if ($request->has('branch_id')) {
            $query->whereHas('inventory.pharmacy', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        // Filter by pharmacy_id
        if ($request->has('pharmacy_id')) {
            $query->whereHas('inventory', function($q) use ($request) {
                $q->where('pharmacy_id', $request->pharmacy_id);
            });
        }

        // Filter by transaction type
        if ($request->has('type')) {
            $query->where('transaction_type', $request->type);
        }

        // Filter by date range
        if ($request->has('from')) {
            $query->where('transaction_date', '>=', $request->from);
        }

        if ($request->has('to')) {
            $query->where('transaction_date', '<=', $request->to);
        }

        $transactions = $query->latest('transaction_date')
            ->limit(100)
            ->get()
            ->map(function($transaction) {
                return [
                    'id' => $transaction->id,
                    'pharmacy_id' => $transaction->inventory?->pharmacy_id,
                    'pharmacy_name' => $transaction->inventory?->pharmacy?->name,
                    'inventory_id' => $transaction->inventory_id,
                    'medicine_name' => $transaction->inventory?->medication_name,
                    'batch_number' => $transaction->inventory?->batch_number,
                    'transaction_type' => $transaction->transaction_type,
                    'quantity' => $transaction->quantity_changed,
                    'unit' => $transaction->inventory?->dosage_form ?? 'units',
                    'reference_number' => $transaction->reference_number,
                    'notes' => $transaction->notes,
                    'created_by' => $transaction->user?->name ?? 'System',
                    'created_at' => $transaction->transaction_date,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => $transactions
            ],
        ]);
    }
}
