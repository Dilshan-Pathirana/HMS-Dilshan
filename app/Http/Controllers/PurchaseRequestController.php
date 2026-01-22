<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Notification;
use App\Models\AllUsers\User;
use App\Jobs\SendPurchaseRequestEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PurchaseRequestController extends Controller
{
    /**
     * Get all purchase requests for pharmacist's branch
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $query = PurchaseRequest::with(['creator', 'approver', 'items.product', 'items.supplier'])
                ->where('branch_id', $branchId);

            // Filter by status if provided
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Sort by latest first
            $purchaseRequests = $query->latest()->get();

            return response()->json([
                'success' => true,
                'data' => $purchaseRequests
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch purchase requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new purchase request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'priority' => 'required|in:Normal,Urgent,Emergency',
            'status' => 'required|in:Draft,Pending,Pending Approval',
            'supplier_id' => 'nullable|uuid|exists:suppliers,id', // PR-level supplier selection (optional)
            'general_remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.supplier_id' => 'nullable|uuid|exists:suppliers,id',
            'items.*.requested_quantity' => 'required|integer|min:1',
            'items.*.suggested_quantity' => 'nullable|integer',
            'items.*.estimated_unit_price' => 'nullable|numeric|min:0',
            'items.*.item_remarks' => 'nullable|string',
            'items.*.is_suggested' => 'nullable|boolean',
            'items.*.suggestion_reason' => 'nullable|string',
        ]);

        try {
            $user = Auth::user();
            
            DB::beginTransaction();

            // Generate PR number
            $prNumber = PurchaseRequest::generatePRNumber();

            // Calculate totals
            $totalCost = 0;
            foreach ($validated['items'] as $item) {
                if (isset($item['estimated_unit_price']) && isset($item['requested_quantity'])) {
                    $totalCost += $item['estimated_unit_price'] * $item['requested_quantity'];
                }
            }

            // Get supplier_id from PR level or from first item
            $supplierId = $validated['supplier_id'] ?? null;
            if (!$supplierId && !empty($validated['items'])) {
                $supplierId = $validated['items'][0]['supplier_id'] ?? null;
            }

            // Create purchase request
            $purchaseRequest = PurchaseRequest::create([
                'pr_number' => $prNumber,
                'branch_id' => $user->branch_id,
                'pharmacy_id' => $user->pharmacy_id ?? null,
                'supplier_id' => $supplierId, // PR-level supplier (from PR or first item)
                'created_by' => $user->id,
                'priority' => $validated['priority'],
                'status' => $validated['status'],
                'general_remarks' => $validated['general_remarks'] ?? null,
                'total_estimated_cost' => $totalCost,
                'total_items' => count($validated['items']),
            ]);

            // Create purchase request items
            foreach ($validated['items'] as $itemData) {
                $itemTotal = isset($itemData['estimated_unit_price']) && isset($itemData['requested_quantity'])
                    ? $itemData['estimated_unit_price'] * $itemData['requested_quantity']
                    : 0;

                PurchaseRequestItem::create([
                    'purchase_request_id' => $purchaseRequest->id,
                    'product_id' => $itemData['product_id'],
                    'supplier_id' => $itemData['supplier_id'] ?? null,
                    'requested_quantity' => $itemData['requested_quantity'],
                    'suggested_quantity' => $itemData['suggested_quantity'] ?? null,
                    'estimated_unit_price' => $itemData['estimated_unit_price'] ?? null,
                    'total_estimated_cost' => $itemTotal,
                    'item_remarks' => $itemData['item_remarks'] ?? null,
                    'is_suggested' => $itemData['is_suggested'] ?? false,
                    'suggestion_reason' => $itemData['suggestion_reason'] ?? null,
                ]);
            }

            DB::commit();

            // Create notifications for Branch Admins if status is Pending Approval (submitted for approval)
            if (in_array($validated['status'], ['Pending', 'Pending Approval'])) {
                // Ensure status is stored as 'Pending Approval' for consistency
                $purchaseRequest->status = 'Pending Approval';
                $purchaseRequest->save();
                
                try {
                    // Find all Branch Admins for this branch (role_as = 2 is branch_admin)
                    $branchAdmins = User::where('branch_id', $user->branch_id)
                        ->where('role_as', 2)
                        ->get();
                    
                    foreach ($branchAdmins as $admin) {
                        Notification::create([
                            'user_id' => $admin->id,
                            'type' => 'reorder_alert', // Using 'reorder_alert' as closest type for purchase requests
                            'title' => 'New Purchase Request: ' . $purchaseRequest->pr_number,
                            'message' => "Purchase Request {$purchaseRequest->pr_number} has been submitted by {$user->first_name} {$user->last_name} and requires your approval. Priority: {$validated['priority']}",
                            'related_type' => 'purchase_request',
                            'related_id' => null,
                            'status' => 'sent',
                            'channel' => 'in_app',
                            'sent_at' => now(),
                        ]);
                    }

                    Log::info("Purchase Request notification created for Branch Admins", [
                        'pr_number' => $purchaseRequest->pr_number,
                        'branch_id' => $user->branch_id,
                        'admin_count' => $branchAdmins->count()
                    ]);
                } catch (\Exception $notifError) {
                    Log::error("Failed to create PR notification", [
                        'pr_number' => $purchaseRequest->pr_number,
                        'error' => $notifError->getMessage()
                    ]);
                }

                // Dispatch email notification if supplier_id is available
                if ($supplierId) {
                    try {
                        SendPurchaseRequestEmail::dispatch($purchaseRequest, $supplierId);
                        
                        Log::info("Purchase Request email job dispatched", [
                            'pr_number' => $purchaseRequest->pr_number,
                            'supplier_id' => $supplierId,
                            'status' => $validated['status']
                        ]);
                    } catch (\Exception $emailError) {
                        Log::error("Failed to dispatch PR email job", [
                            'pr_number' => $purchaseRequest->pr_number,
                            'supplier_id' => $supplierId,
                            'error' => $emailError->getMessage()
                        ]);
                    }
                }
            }

            // Load relationships for response
            $purchaseRequest->load(['creator', 'items.product', 'items.supplier']);

            return response()->json([
                'success' => true,
                'message' => 'Purchase request created successfully',
                'data' => $purchaseRequest
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create purchase request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single purchase request
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            $purchaseRequest = PurchaseRequest::with([
                'creator',
                'approver',
                'rejecter',
                'items.product',
                'items.supplier',
                'branch'
            ])
            ->where('branch_id', $user->branch_id)
            ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $purchaseRequest
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase request not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update purchase request (only for Draft status)
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'priority' => 'required|in:Normal,Urgent,Emergency',
            'general_remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.supplier_id' => 'nullable|uuid|exists:suppliers,id',
            'items.*.requested_quantity' => 'required|integer|min:1',
            'items.*.estimated_unit_price' => 'nullable|numeric|min:0',
            'items.*.item_remarks' => 'nullable|string',
        ]);

        try {
            $user = Auth::user();
            
            $purchaseRequest = PurchaseRequest::where('branch_id', $user->branch_id)
                ->where('status', 'Draft')
                ->findOrFail($id);

            DB::beginTransaction();

            // Calculate new totals
            $totalCost = 0;
            foreach ($validated['items'] as $item) {
                if (isset($item['estimated_unit_price']) && isset($item['requested_quantity'])) {
                    $totalCost += $item['estimated_unit_price'] * $item['requested_quantity'];
                }
            }

            // Update purchase request
            $purchaseRequest->update([
                'priority' => $validated['priority'],
                'general_remarks' => $validated['general_remarks'] ?? null,
                'total_estimated_cost' => $totalCost,
                'total_items' => count($validated['items']),
            ]);

            // Delete old items and create new ones
            $purchaseRequest->items()->delete();

            foreach ($validated['items'] as $itemData) {
                $itemTotal = isset($itemData['estimated_unit_price']) && isset($itemData['requested_quantity'])
                    ? $itemData['estimated_unit_price'] * $itemData['requested_quantity']
                    : 0;

                PurchaseRequestItem::create([
                    'purchase_request_id' => $purchaseRequest->id,
                    'product_id' => $itemData['product_id'],
                    'supplier_id' => $itemData['supplier_id'] ?? null,
                    'requested_quantity' => $itemData['requested_quantity'],
                    'estimated_unit_price' => $itemData['estimated_unit_price'] ?? null,
                    'total_estimated_cost' => $itemTotal,
                    'item_remarks' => $itemData['item_remarks'] ?? null,
                ]);
            }

            DB::commit();

            $purchaseRequest->load(['creator', 'items.product', 'items.supplier']);

            return response()->json([
                'success' => true,
                'message' => 'Purchase request updated successfully',
                'data' => $purchaseRequest
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update purchase request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit purchase request for approval
     */
    public function submit($id)
    {
        try {
            $user = Auth::user();
            
            $purchaseRequest = PurchaseRequest::where('branch_id', $user->branch_id)
                ->where('status', 'Draft')
                ->findOrFail($id);

            $purchaseRequest->update(['status' => 'Pending Approval']);

            // Send notifications to Branch Admins
            try {
                $branchAdmins = User::where('branch_id', $user->branch_id)
                    ->where('role_as', 2)
                    ->get();
                
                foreach ($branchAdmins as $admin) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'type' => 'reorder_alert',
                        'title' => 'New Purchase Request: ' . $purchaseRequest->pr_number,
                        'message' => "Purchase Request {$purchaseRequest->pr_number} has been submitted by {$user->first_name} {$user->last_name} and requires your approval. Priority: {$purchaseRequest->priority}",
                        'related_type' => 'purchase_request',
                        'related_id' => null,
                        'status' => 'sent',
                        'channel' => 'in_app',
                        'sent_at' => now(),
                    ]);
                }

                Log::info("Purchase Request submitted notification sent", [
                    'pr_number' => $purchaseRequest->pr_number,
                    'branch_id' => $user->branch_id,
                    'admin_count' => $branchAdmins->count()
                ]);
            } catch (\Exception $notifError) {
                Log::error("Failed to send PR submit notification", [
                    'pr_number' => $purchaseRequest->pr_number,
                    'error' => $notifError->getMessage()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Purchase request submitted for approval'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit purchase request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete purchase request (only Draft status)
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            $purchaseRequest = PurchaseRequest::where('branch_id', $user->branch_id)
                ->where('status', 'Draft')
                ->findOrFail($id);

            $purchaseRequest->delete();

            return response()->json([
                'success' => true,
                'message' => 'Purchase request deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete purchase request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Advanced item search for manual PR addition
     * Supports: name, partial name, barcode, item code, generic name, brand name
     */
    public function searchItems(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;
            $pharmacyId = $user->pharmacy_id;
            
            $searchTerm = $request->input('search', '');
            
            // Minimum 2 characters required
            if (strlen($searchTerm) < 2) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Search with priority order:
            // 1. Exact barcode match (highest priority)
            // 2. Exact item code match
            // 3. Partial name/generic/brand match
            
            // Use proper table names: products and products_stock
            // Note: products table doesn't have branch_id or status columns
            $likeTerm = '%' . strtolower($searchTerm) . '%';
            
            $items = \DB::table('products')
                ->leftJoin('products_stock', 'products.id', '=', 'products_stock.product_id')
                ->leftJoin('suppliers', 'products.supplier_id', '=', 'suppliers.id')
                ->where(function($q) use ($searchTerm, $likeTerm) {
                    $q->where('products.barcode', '=', $searchTerm)
                      ->orWhere('products.item_code', '=', $searchTerm)
                      ->orWhereRaw('LOWER(products.item_name) LIKE ?', [$likeTerm])
                      ->orWhereRaw('LOWER(products.generic_name) LIKE ?', [$likeTerm])
                      ->orWhereRaw('LOWER(products.brand_name) LIKE ?', [$likeTerm]);
                })
                ->select([
                    'products.id',
                    'products.item_name',
                    'products.item_code',
                    'products.barcode',
                    'products.generic_name',
                    'products.brand_name',
                    'products_stock.unit',
                    'products_stock.reorder_level',
                    'products_stock.unit_cost',
                    'products.supplier_id',
                    \DB::raw('COALESCE(products_stock.current_stock, 0) as current_stock'),
                    'suppliers.supplier_name',
                    \DB::raw('CASE 
                        WHEN products.barcode = ' . \DB::getPdo()->quote($searchTerm) . ' THEN 1
                        WHEN products.item_code = ' . \DB::getPdo()->quote($searchTerm) . ' THEN 2
                        WHEN LOWER(products.item_name) LIKE ' . \DB::getPdo()->quote($likeTerm) . ' THEN 3
                        WHEN LOWER(products.generic_name) LIKE ' . \DB::getPdo()->quote($likeTerm) . ' THEN 4
                        WHEN LOWER(products.brand_name) LIKE ' . \DB::getPdo()->quote($likeTerm) . ' THEN 5
                        ELSE 6
                    END as priority')
                ])
                ->orderByRaw('CASE 
                    WHEN products.barcode = ' . \DB::getPdo()->quote($searchTerm) . ' THEN 1
                    WHEN products.item_code = ' . \DB::getPdo()->quote($searchTerm) . ' THEN 2
                    WHEN LOWER(products.item_name) LIKE ' . \DB::getPdo()->quote($likeTerm) . ' THEN 3
                    WHEN LOWER(products.generic_name) LIKE ' . \DB::getPdo()->quote($likeTerm) . ' THEN 4
                    WHEN LOWER(products.brand_name) LIKE ' . \DB::getPdo()->quote($likeTerm) . ' THEN 5
                    ELSE 6
                END')
                ->orderBy('products.item_name')
                ->limit(20)
                ->get();

            // Format results
            $formattedItems = array_map(function($item) {
                $currentStock = $item->current_stock ?? 0;
                $reorderLevel = $item->reorder_level ?? 0;
                
                // Determine stock status
                $stockStatus = 'in_stock';
                if ($currentStock == 0) {
                    $stockStatus = 'out_of_stock';
                } elseif ($currentStock <= $reorderLevel) {
                    $stockStatus = 'low_stock';
                }

                return [
                    'id' => $item->id,
                    'item_name' => $item->item_name,
                    'item_code' => $item->item_code,
                    'barcode' => $item->barcode,
                    'generic_name' => $item->generic_name,
                    'brand_name' => $item->brand_name,
                    'unit' => $item->unit ?? 'units',
                    'current_stock' => $currentStock,
                    'reorder_level' => $reorderLevel,
                    'last_purchase_price' => $item->unit_cost ?? 0,
                    'stock_status' => $stockStatus,
                    'supplier_id' => $item->supplier_id,
                    'supplier_name' => $item->supplier_name,
                    'match_type' => $item->priority == 1 ? 'barcode' : ($item->priority == 2 ? 'code' : 'name')
                ];
            }, $items->toArray());

            return response()->json([
                'success' => true,
                'data' => $formattedItems
            ]);

        } catch (\Exception $e) {
            Log::error('Item search failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to search items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get purchase request statistics
     */
    public function getStats()
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $stats = [
                'total' => PurchaseRequest::where('branch_id', $branchId)->count(),
                'draft' => PurchaseRequest::where('branch_id', $branchId)->where('status', 'Draft')->count(),
                'pending' => PurchaseRequest::where('branch_id', $branchId)->where('status', 'Pending Approval')->count(),
                'approved' => PurchaseRequest::where('branch_id', $branchId)->where('status', 'Approved')->count(),
                'rejected' => PurchaseRequest::where('branch_id', $branchId)->where('status', 'Rejected')->count(),
                'converted' => PurchaseRequest::where('branch_id', $branchId)->where('status', 'Converted')->count(),
                'clarification_requested' => PurchaseRequest::where('branch_id', $branchId)->where('status', 'Clarification Requested')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get count of PRs needing clarification for the current pharmacist
     */
    public function getClarificationCount()
    {
        try {
            $user = Auth::user();
            
            $count = PurchaseRequest::where('branch_id', $user->branch_id)
                ->where('created_by', $user->id)
                ->where('status', 'Clarification Requested')
                ->count();

            return response()->json([
                'success' => true,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch clarification count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get PRs that need clarification for the current pharmacist
     */
    public function getClarificationRequests()
    {
        try {
            $user = Auth::user();
            
            $prs = PurchaseRequest::with(['creator', 'items', 'approver'])
                ->where('branch_id', $user->branch_id)
                ->where('created_by', $user->id)
                ->where('status', 'Clarification Requested')
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $prs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch clarification requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resubmit a PR after responding to clarification request
     */
    public function resubmitAfterClarification(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $user = Auth::user();
            
            $purchaseRequest = PurchaseRequest::where('id', $id)
                ->where('branch_id', $user->branch_id)
                ->where('created_by', $user->id)
                ->where('status', 'Clarification Requested')
                ->firstOrFail();

            // Update PR details if provided
            if ($request->has('supplier_id')) {
                $purchaseRequest->supplier_id = $request->supplier_id;
            }

            if ($request->has('priority')) {
                $purchaseRequest->priority = $request->priority;
            }

            // Add pharmacist response to remarks
            if ($request->has('clarification_response')) {
                $purchaseRequest->general_remarks = ($purchaseRequest->general_remarks ? $purchaseRequest->general_remarks . "\n\n" : '') 
                    . "[Clarification Response - " . now()->format('Y-m-d H:i') . "]: " . $request->clarification_response;
            }

            // Update items if provided
            if ($request->has('items')) {
                // Delete existing items
                $purchaseRequest->items()->delete();

                // Add updated items
                $totalEstimatedCost = 0;
                foreach ($request->items as $item) {
                    $itemCost = $item['requested_quantity'] * $item['estimated_unit_price'];
                    $totalEstimatedCost += $itemCost;

                    PurchaseRequestItem::create([
                        'purchase_request_id' => $purchaseRequest->id,
                        'product_id' => $item['product_id'],
                        'supplier_id' => $item['supplier_id'] ?? $purchaseRequest->supplier_id,
                        'requested_quantity' => $item['requested_quantity'],
                        'suggested_quantity' => $item['suggested_quantity'] ?? null,
                        'estimated_unit_price' => $item['estimated_unit_price'],
                        'total_estimated_cost' => $itemCost,
                        'item_remarks' => $item['item_remarks'] ?? null,
                        'is_suggested' => $item['is_suggested'] ?? false,
                        'suggestion_reason' => $item['suggestion_reason'] ?? null,
                    ]);
                }

                $purchaseRequest->total_estimated_cost = $totalEstimatedCost;
                $purchaseRequest->total_items = count($request->items);
            }

            // Change status back to Pending Approval
            $purchaseRequest->status = 'Pending Approval';
            $purchaseRequest->save();

            DB::commit();

            // Log the resubmission
            Log::info('PR resubmitted after clarification', [
                'pr_id' => $purchaseRequest->id,
                'pr_number' => $purchaseRequest->pr_number,
                'pharmacist_id' => $user->id,
                'pharmacist_name' => $user->first_name . ' ' . $user->last_name
            ]);

            // Reload the PR with relationships
            $purchaseRequest->load(['creator', 'items', 'approver']);

            return response()->json([
                'success' => true,
                'message' => 'Purchase request resubmitted for approval',
                'data' => $purchaseRequest
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to resubmit PR after clarification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to resubmit purchase request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== BRANCH ADMIN METHODS ====================

    /**
     * Get all pending purchase requests for branch admin
     */
    public function getPendingPRsForAdmin(Request $request)
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $query = PurchaseRequest::with(['creator', 'items.product', 'items.supplier', 'approver'])
                ->where('branch_id', $branchId)
                ->where('status', 'Pending Approval');

            // Filter by requester role
            if ($request->has('requester_role') && $request->requester_role !== 'all') {
                $query->whereHas('creator', function($q) use ($request) {
                    $q->where('user_type', $request->requester_role);
                });
            }

            // Filter by supplier
            if ($request->has('supplier_id') && $request->supplier_id !== 'all') {
                $query->where('supplier_id', $request->supplier_id);
            }

            // Filter by date range
            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Filter by priority
            if ($request->has('priority') && $request->priority !== 'all') {
                $query->where('priority', $request->priority);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'urgent_first');
            switch ($sortBy) {
                case 'urgent_first':
                    // Use CASE WHEN for SQLite compatibility instead of FIELD()
                    $query->orderByRaw("CASE 
                        WHEN priority = 'Emergency' THEN 1 
                        WHEN priority = 'Urgent' THEN 2 
                        WHEN priority = 'Normal' THEN 3 
                        ELSE 4 
                    END");
                    break;
                case 'oldest_first':
                    $query->oldest();
                    break;
                case 'newest_first':
                    $query->latest();
                    break;
                default:
                    $query->latest();
            }

            $purchaseRequests = $query->get();

            return response()->json([
                'success' => true,
                'data' => $purchaseRequests
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch pending PRs for admin', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending purchase requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get count of pending PRs for branch admin (for badge)
     */
    public function getPendingCount()
    {
        try {
            $user = Auth::user();
            $branchId = $user->branch_id;

            $count = PurchaseRequest::where('branch_id', $branchId)
                ->where('status', 'Pending Approval')
                ->count();

            return response()->json([
                'success' => true,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get count of unread notifications for branch admin
     */
    public function getUnreadNotificationCount()
    {
        try {
            $user = Auth::user();

            $count = Notification::where('user_id', $user->id)
                ->where('status', 'unread')
                ->count();

            return response()->json([
                'success' => true,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notification count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update PR items and details (Branch Admin only)
     */
    public function updatePRByAdmin(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $user = Auth::user();
            $pr = PurchaseRequest::where('id', $id)
                ->where('branch_id', $user->branch_id)
                ->where('status', 'Pending Approval')
                ->firstOrFail();

            // Log the original state for audit
            $originalData = [
                'supplier_id' => $pr->supplier_id,
                'priority' => $pr->priority,
                'items_count' => $pr->items->count(),
                'total_estimated_cost' => $pr->total_estimated_cost
            ];

            // Update PR details
            if ($request->has('supplier_id')) {
                $pr->supplier_id = $request->supplier_id;
            }

            if ($request->has('priority')) {
                $pr->priority = $request->priority;
            }

            if ($request->has('admin_remarks')) {
                $pr->general_remarks = ($pr->general_remarks ? $pr->general_remarks . "\n\n" : '') 
                    . "[Admin Edit - " . now()->format('Y-m-d H:i') . "]: " . $request->admin_remarks;
            }

            // Update items if provided
            if ($request->has('items')) {
                // Delete existing items
                $pr->items()->delete();

                // Add updated items
                $totalEstimatedCost = 0;
                foreach ($request->items as $item) {
                    $itemCost = $item['requested_quantity'] * $item['estimated_price'];
                    $totalEstimatedCost += $itemCost;

                    // Use item-level supplier_id if provided, otherwise fall back to PR-level supplier
                    $itemSupplierId = $item['supplier_id'] ?? $pr->supplier_id;

                    PurchaseRequestItem::create([
                        'purchase_request_id' => $pr->id,
                        'product_id' => $item['item_id'],
                        'supplier_id' => $itemSupplierId,
                        'requested_quantity' => $item['requested_quantity'],
                        'suggested_quantity' => $item['suggested_quantity'] ?? null,
                        'estimated_unit_price' => $item['estimated_price'],
                        'total_estimated_cost' => $itemCost,
                        'item_remarks' => $item['remarks'] ?? '',
                        'is_suggested' => $item['is_suggested'] ?? false,
                        'suggestion_reason' => $item['suggestion_reason'] ?? null
                    ]);
                }

                $pr->total_estimated_cost = $totalEstimatedCost;
                $pr->total_items = count($request->items);
            }

            $pr->save();

            // Audit log
            Log::info('Branch Admin edited Purchase Request', [
                'pr_id' => $pr->id,
                'pr_number' => $pr->pr_number,
                'admin_id' => $user->id,
                'admin_name' => $user->first_name . ' ' . $user->last_name,
                'original_data' => $originalData,
                'updated_data' => [
                    'supplier_id' => $pr->supplier_id,
                    'priority' => $pr->priority,
                    'items_count' => $pr->items()->count(),
                    'total_estimated_cost' => $pr->total_estimated_cost
                ],
                'timestamp' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Purchase request updated successfully',
                'data' => $pr->load(['items.product', 'items.supplier', 'creator'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update purchase request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve purchase request
     */
    public function approvePR(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $user = Auth::user();
            $pr = PurchaseRequest::where('id', $id)
                ->where('branch_id', $user->branch_id)
                ->where('status', 'Pending Approval')
                ->firstOrFail();

            $pr->status = 'Approved';
            $pr->approved_by = $user->id;
            $pr->approved_at = now();
            $pr->approval_remarks = $request->input('approval_remarks', '');
            $pr->save();

            // Audit log
            Log::info('Purchase Request Approved', [
                'pr_id' => $pr->id,
                'pr_number' => $pr->pr_number,
                'approved_by' => $user->id,
                'approver_name' => $user->first_name . ' ' . $user->last_name,
                'approval_remarks' => $pr->approval_remarks,
                'timestamp' => now()
            ]);

            DB::commit();

            // Send email notification to all unique suppliers in this PR
            // Wrapped in try-catch so email failures don't affect the approval
            $emailsSent = 0;
            $emailsFailed = 0;
            try {
                $pr->load(['items.supplier', 'branch', 'approver']);
                $supplierIds = $pr->items->pluck('supplier_id')->unique()->filter();
                
                foreach ($supplierIds as $supplierId) {
                    if ($supplierId) {
                        try {
                            \App\Jobs\SendPurchaseApprovalEmail::dispatch($pr, $supplierId);
                            $emailsSent++;
                            Log::info('Queued approval email for supplier', [
                                'pr_number' => $pr->pr_number,
                                'supplier_id' => $supplierId
                            ]);
                        } catch (\Exception $emailEx) {
                            $emailsFailed++;
                            Log::warning('Failed to send approval email to supplier', [
                                'pr_number' => $pr->pr_number,
                                'supplier_id' => $supplierId,
                                'error' => $emailEx->getMessage()
                            ]);
                        }
                    }
                }
            } catch (\Exception $emailException) {
                Log::warning('Failed to process supplier emails', [
                    'pr_number' => $pr->pr_number,
                    'error' => $emailException->getMessage()
                ]);
            }

            $message = 'Purchase request approved successfully.';
            if ($emailsSent > 0) {
                $message .= " {$emailsSent} supplier notification email(s) sent.";
            }
            if ($emailsFailed > 0) {
                $message .= " {$emailsFailed} email(s) failed to send.";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $pr->load(['items.product', 'items.supplier', 'creator', 'approver'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve purchase request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject purchase request
     */
    public function rejectPR(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'required|string|min:10'
        ]);

        DB::beginTransaction();
        try {
            $user = Auth::user();
            $pr = PurchaseRequest::where('id', $id)
                ->where('branch_id', $user->branch_id)
                ->where('status', 'Pending Approval')
                ->firstOrFail();

            $pr->status = 'Rejected';
            $pr->rejected_by = $user->id;
            $pr->rejected_at = now();
            $pr->rejection_reason = $request->rejection_reason;
            $pr->save();

            // Audit log
            Log::info('Purchase Request Rejected', [
                'pr_id' => $pr->id,
                'pr_number' => $pr->pr_number,
                'rejected_by' => $user->id,
                'rejector_name' => $user->first_name . ' ' . $user->last_name,
                'rejection_reason' => $pr->rejection_reason,
                'timestamp' => now()
            ]);

            DB::commit();

            // TODO: Send notification to pharmacist

            return response()->json([
                'success' => true,
                'message' => 'Purchase request rejected',
                'data' => $pr->load(['items.product', 'items.supplier', 'creator', 'rejecter'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject purchase request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send back for clarification
     */
    public function requestClarification(Request $request, $id)
    {
        $request->validate([
            'clarification_request' => 'required|string|min:10'
        ]);

        DB::beginTransaction();
        try {
            $user = Auth::user();
            $pr = PurchaseRequest::where('id', $id)
                ->where('branch_id', $user->branch_id)
                ->where('status', 'Pending Approval')
                ->firstOrFail();

            $pr->status = 'Clarification Requested';
            $pr->general_remarks = ($pr->general_remarks ? $pr->general_remarks . "\n\n" : '') 
                . "[Clarification Requested - " . now()->format('Y-m-d H:i') . " by " 
                . $user->first_name . ' ' . $user->last_name . "]: " 
                . $request->clarification_request;
            $pr->save();

            // Audit log
            Log::info('Purchase Request Clarification Requested', [
                'pr_id' => $pr->id,
                'pr_number' => $pr->pr_number,
                'requested_by' => $user->id,
                'requester_name' => $user->first_name . ' ' . $user->last_name,
                'clarification_request' => $request->clarification_request,
                'timestamp' => now()
            ]);

            DB::commit();

            // TODO: Send notification to pharmacist

            return response()->json([
                'success' => true,
                'message' => 'Clarification requested successfully',
                'data' => $pr->load(['items.product', 'items.supplier', 'creator'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to request clarification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
