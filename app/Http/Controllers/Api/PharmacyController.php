<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PharmacyController extends Controller
{
    /**
     * Get all pharmacies or filter by branch
     */
    public function index(Request $request): JsonResponse
    {
        $query = Pharmacy::with('branch');

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $pharmacies = $query->get()->map(function ($pharmacy) {
            return [
                'id' => $pharmacy->id,
                'branch_id' => $pharmacy->branch_id,
                'name' => $pharmacy->pharmacy_name,
                'location' => $pharmacy->location_in_branch,
                'contact_number' => $pharmacy->phone,
                'email' => $pharmacy->email,
                'manager_name' => $pharmacy->pharmacy_code, // Using pharmacy_code as placeholder for manager_name
                'status' => $pharmacy->is_active ? 'active' : 'inactive',
                'created_at' => $pharmacy->created_at,
                'branch' => $pharmacy->branch ? [
                    'center_name' => $pharmacy->branch->center_name
                ] : null,
                // Additional fields for detailed view
                'pharmacy_code' => $pharmacy->pharmacy_code,
                'license_number' => $pharmacy->license_number,
                'license_expiry_date' => $pharmacy->license_expiry_date,
                'operating_hours' => $pharmacy->operating_hours,
                'inventory_count' => $pharmacy->inventory()->count(),
                'low_stock_count' => $pharmacy->inventory()->whereRaw('quantity_in_stock <= reorder_level')->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'pharmacies' => $pharmacies
            ],
        ]);
    }

    /**
     * Get pharmacy details
     */
    public function show(string $id): JsonResponse
    {
        $pharmacy = Pharmacy::with(['branch', 'inventory'])->find($id);

        if (!$pharmacy) {
            return response()->json([
                'success' => false,
                'message' => 'Pharmacy not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $pharmacy,
        ]);
    }

    /**
     * Create new pharmacy
     */
    public function store(Request $request): JsonResponse
    {
        // Map frontend field names to backend
        $data = $request->all();
        if (isset($data['name'])) {
            $data['pharmacy_name'] = $data['name'];
        }
        if (isset($data['location'])) {
            $data['location_in_branch'] = $data['location'];
        }
        if (isset($data['contact_number'])) {
            $data['phone'] = $data['contact_number'];
        }
        if (isset($data['status'])) {
            $data['is_active'] = $data['status'] === 'active';
        }

        // Set default license number if not provided - make it unique
        if (!isset($data['license_number'])) {
            $data['license_number'] = 'LIC-' . strtoupper(substr(uniqid(), -8));
        }

        // Remove operating_hours if it exists as empty string
        if (isset($data['operating_hours']) && (empty($data['operating_hours']) || $data['operating_hours'] === '')) {
            unset($data['operating_hours']);
        }

        $validator = Validator::make($data, [
            'branch_id' => 'required|exists:branches,id',
            'pharmacy_name' => 'required|string|max:100',
            'pharmacy_code' => 'required|string|max:20|unique:pharmacies,pharmacy_code',
            'license_number' => 'required|string|max:50|unique:pharmacies,license_number',
            'license_expiry_date' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'location_in_branch' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check for conflicts unless force_reassign is true
        if (!$request->force_reassign) {
            $existingPharmacy = Pharmacy::where('pharmacy_code', $data['pharmacy_code'])
                ->where('branch_id', '!=', $data['branch_id'])
                ->with('branch')
                ->first();

            if ($existingPharmacy) {
                return response()->json([
                    'conflict' => true,
                    'pharmacy_id' => $existingPharmacy->id,
                    'existing_branch' => [
                        'id' => $existingPharmacy->branch_id,
                        'center_name' => $existingPharmacy->branch->center_name ?? 'Unknown',
                    ],
                ], 409);
            }
        }

        // Only pass the exact fields needed for creation
        $createData = [
            'branch_id' => $data['branch_id'],
            'pharmacy_name' => $data['pharmacy_name'],
            'pharmacy_code' => $data['pharmacy_code'],
            'license_number' => $data['license_number'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'location_in_branch' => $data['location_in_branch'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ];

        if (isset($data['license_expiry_date'])) {
            $createData['license_expiry_date'] = $data['license_expiry_date'];
        }

        $pharmacy = Pharmacy::create($createData);

        return response()->json([
            'success' => true,
            'message' => 'Pharmacy created successfully',
            'data' => $pharmacy,
        ], 201);
    }

    /**
     * Update pharmacy
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $pharmacy = Pharmacy::find($id);

        if (!$pharmacy) {
            return response()->json([
                'success' => false,
                'message' => 'Pharmacy not found',
            ], 404);
        }

        // Map frontend field names to backend field names
        $data = $request->all();
        if (isset($data['name'])) {
            $data['pharmacy_name'] = $data['name'];
        }
        if (isset($data['location'])) {
            $data['location_in_branch'] = $data['location'];
        }
        if (isset($data['contact_number'])) {
            $data['phone'] = $data['contact_number'];
        }
        if (isset($data['status'])) {
            $data['is_active'] = $data['status'] === 'active';
        }

        $validator = Validator::make($data, [
            'branch_id' => 'nullable|exists:branches,id',
            'pharmacy_name' => 'sometimes|string|max:100',
            'pharmacy_code' => 'sometimes|string|max:20|unique:pharmacies,pharmacy_code,' . $id,
            'license_number' => 'sometimes|string|max:50|unique:pharmacies,license_number,' . $id,
            'license_expiry_date' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'location_in_branch' => 'nullable|string',
            'operating_hours' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $pharmacy->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Pharmacy updated successfully',
            'data' => $pharmacy,
        ]);
    }

    /**
     * Delete pharmacy
     */
    public function destroy(string $id): JsonResponse
    {
        $pharmacy = Pharmacy::find($id);

        if (!$pharmacy) {
            return response()->json([
                'success' => false,
                'message' => 'Pharmacy not found',
            ], 404);
        }

        $pharmacy->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pharmacy deleted successfully',
        ]);
    }

    /**
     * Get pharmacy inventory
     */
    public function inventory(string $id): JsonResponse
    {
        $pharmacy = Pharmacy::find($id);

        if (!$pharmacy) {
            return response()->json([
                'success' => false,
                'message' => 'Pharmacy not found',
            ], 404);
        }

        $inventory = $pharmacy->inventory()->get();

        return response()->json([
            'success' => true,
            'data' => $inventory,
        ]);
    }

    /**
     * Get low stock items
     */
    public function lowStock(string $id): JsonResponse
    {
        $pharmacy = Pharmacy::find($id);

        if (!$pharmacy) {
            return response()->json([
                'success' => false,
                'message' => 'Pharmacy not found',
            ], 404);
        }

        $lowStock = $pharmacy->lowStockItems()->get();

        return response()->json([
            'success' => true,
            'data' => $lowStock,
        ]);
    }

    /**
     * Get expiring items
     */
    public function expiring(string $id): JsonResponse
    {
        $pharmacy = Pharmacy::find($id);

        if (!$pharmacy) {
            return response()->json([
                'success' => false,
                'message' => 'Pharmacy not found',
            ], 404);
        }

        $expiring = $pharmacy->expiringItems()->get();

        return response()->json([
            'success' => true,
            'data' => $expiring,
        ]);
    }

    /**
     * Check for pharmacy conflicts before assignment
     */
    public function checkConflict(Request $request): JsonResponse
    {
        $pharmacyCode = $request->pharmacy_code ?? $request->manager_name;
        $branchId = $request->branch_id;

        if (!$pharmacyCode) {
            return response()->json([
                'conflict' => false,
            ]);
        }

        // Check if pharmacy with same code exists in different branch
        $existingPharmacy = Pharmacy::where('pharmacy_code', $pharmacyCode)
            ->where('branch_id', '!=', $branchId)
            ->with('branch')
            ->first();

        if ($existingPharmacy) {
            return response()->json([
                'conflict' => true,
                'pharmacy_id' => $existingPharmacy->id,
                'existing_branch' => [
                    'id' => $existingPharmacy->branch_id,
                    'center_name' => $existingPharmacy->branch->center_name ?? 'Unknown',
                ],
            ], 409);
        }

        return response()->json([
            'conflict' => false,
        ]);
    }
}
