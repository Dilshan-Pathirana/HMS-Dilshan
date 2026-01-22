<?php

namespace App\Http\Controllers\Pharmacy\Supplier;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Action\Supplier\CreateSupplier;
use App\Action\Pharmacy\Supplier\SupplierDelete;
use App\Action\Pharmacy\Supplier\GetAllSupplierDetails;
use App\Action\Pharmacy\Supplier\UpdateExistingSupplier;
use App\Http\Requests\Pharmacy\Supplier\SupplierCreateRequest;
use App\Http\Requests\Pharmacy\Supplier\SupplierUpdateRequest;

class SupplierController extends Controller
{
    public function addSupplier(SupplierCreateRequest $request, CreateSupplier $createSupplier): JsonResponse
    {
        $validatedSupplierCreateRequest = $request->validated();

        if ($validatedSupplierCreateRequest) {
            return response()->json($createSupplier($validatedSupplierCreateRequest));
        }

        return response()->json();
    }

    public function updateSupplier(
        string $supplierId,
        SupplierUpdateRequest $request,
        UpdateExistingSupplier $updateExistingSupplier
    ): JsonResponse {
        try {
            $validatedSupplierUpdateRequest = $request->validated();

            if ($validatedSupplierUpdateRequest) {
                $response = $updateExistingSupplier($supplierId, $validatedSupplierUpdateRequest);

                return response()->json($response);
            }

            return response()->json(['message' => 'No valid data provided'], 400);
        } catch (Exception $exception) {
            Log::error($exception->getMessage());

            return response()->json(['message' => 'An error occurred while updating the supplier'], 500);
        }
    }

    public function getSupplierDetails(GetAllSupplierDetails $getAllSupplierDetails, \Illuminate\Http\Request $request): JsonResponse
    {
        return response()->json($getAllSupplierDetails($request));
    }

    public function deleteSupplier(string $supplierId, SupplierDelete $supplierDelete): JsonResponse
    {
        try {
            if ($supplierId) {
                return response()->json($supplierDelete($supplierId));
            }

            return response()->json(['message' => 'No supplier ID provided'], 400);
        } catch (Exception $exception) {
            Log::error($exception->getMessage());

            return response()->json(['message' => 'An error occurred while deleting the supplier'], 500);
        }
    }

    public function createUserAccount(string $supplierId): JsonResponse
    {
        try {
            $supplier = \App\Models\Pharmacy\Supplier::findOrFail($supplierId);

            // Check if user account already exists
            if ($supplier->user_id) {
                return response()->json([
                    'status' => 400,
                    'message' => 'User account already exists for this supplier'
                ], 400);
            }

            // Generate username from supplier name
            $username = strtolower(str_replace(' ', '_', $supplier->supplier_name));
            $baseUsername = $username;
            $counter = 1;
            
            // Ensure unique username
            while (\App\Models\AllUsers\User::where('username', $username)->exists()) {
                $username = $baseUsername . '_' . $counter;
                $counter++;
            }

            // Generate random password
            $password = 'Supplier' . rand(1000, 9999) . '!';

            // Split supplier name for first/last name
            $nameParts = explode(' ', $supplier->supplier_name);
            $firstName = $nameParts[0];
            $lastName = isset($nameParts[1]) ? implode(' ', array_slice($nameParts, 1)) : $firstName;

            // Create user account
            $user = \App\Models\AllUsers\User::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'name' => $supplier->supplier_name,
                'username' => $username,
                'email' => $supplier->contact_email,
                'phone' => $supplier->contact_number,
                'password' => \Hash::make($password),
                'role_as' => 8, // supplier_entity role
                'user_type' => 'supplier_entity',
                'is_active' => 1,
            ]);

            // Link user to supplier
            $supplier->user_id = $user->id;
            $supplier->save();

            return response()->json([
                'status' => 200,
                'message' => 'User account created successfully',
                'credentials' => [
                    'username' => $username,
                    'password' => $password,
                    'email' => $supplier->contact_email,
                    'supplier_name' => $supplier->supplier_name
                ]
            ]);

        } catch (\Exception $exception) {
            Log::error('Failed to create user account: ' . $exception->getMessage());

            return response()->json([
                'status' => 500,
                'message' => 'Failed to create user account: ' . $exception->getMessage()
            ], 500);
        }
    }
}
