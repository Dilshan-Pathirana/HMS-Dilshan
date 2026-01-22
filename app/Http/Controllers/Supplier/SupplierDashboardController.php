<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Pharmacy\Supplier;
use App\Models\AllUsers\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class SupplierDashboardController extends Controller
{
    /**
     * Get supplier dashboard data
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $supplier = Supplier::where('user_id', $user->id)->with('pharmacy')->first();

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier profile not found'
                ], 404);
            }

            // Get dashboard statistics (placeholder - can be expanded)
            $stats = [
                'total_orders' => 0, // Can be implemented when order system is ready
                'pending_orders' => 0,
                'completed_orders' => 0,
                'total_products' => 0,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'supplier' => $supplier,
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load dashboard: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get supplier profile
     */
    public function profile(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $supplier = Supplier::where('user_id', $user->id)->with('pharmacy')->first();

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier profile not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user,
                    'supplier' => $supplier
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load profile: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update supplier profile
     */
    public function updateProfile(Request $request): JsonResponse
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
                'contact_person' => 'nullable|string|max:255',
                'contact_number' => 'nullable|string|max:20',
                'contact_email' => 'nullable|email|max:255',
                'supplier_address' => 'nullable|string',
                'supplier_city' => 'nullable|string|max:100',
                'supplier_country' => 'nullable|string|max:100',
                'bank_details' => 'nullable|string',
                'note' => 'nullable|string',
            ]);

            $supplier->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $supplier
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ], 500);
        }
    }
}
