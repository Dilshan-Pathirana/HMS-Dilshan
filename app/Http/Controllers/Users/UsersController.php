<?php

namespace App\Http\Controllers\Users;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Guards\GuardAuthenticatedUser;
use App\Http\Requests\User\UserSignInValidationRequest;

class UsersController extends Controller
{
    public function userSignIn(
        UserSignInValidationRequest $request,
        GuardAuthenticatedUser $guardAuthenticatedUser
    ): JsonResponse {
        $validatedUserSignInRequest = $request->validated();

        if ($validatedUserSignInRequest) {
            return response()->json($guardAuthenticatedUser($validatedUserSignInRequest));
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    public function userSignOut(): JsonResponse
    {
        $user = auth()->user();

        if ($user) {
            $user->tokens()->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Log out successful',
            ]);
        }

        // If no user is authenticated, still return success
        // (user might already be logged out or token expired)
        return response()->json([
            'status' => 200,
            'message' => 'Log out successful',
        ]);
    }

    public function updateSupplierEntity(Request $request, string $userId): JsonResponse
    {
        try {
            $user = \App\Models\AllUsers\User::findOrFail($userId);

            // Check if it's a supplier entity user
            if ($user->role_as != 8) {
                return response()->json([
                    'status' => 400,
                    'message' => 'User is not a supplier entity'
                ], 400);
            }

            // Validate the input
            $validated = $request->validate([
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'username' => 'sometimes|string|max:255|unique:users,username,' . $userId . ',user_id',
                'email' => 'sometimes|email|max:255|unique:users,email,' . $userId . ',user_id',
                'phone' => 'sometimes|string|max:20',
                'address' => 'sometimes|string|max:500',
                'is_active' => 'sometimes|boolean',
            ]);

            // Update user fields
            $user->fill($validated);
            $user->save();

            return response()->json([
                'status' => 200,
                'message' => 'Supplier entity user updated successfully',
                'data' => $user
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update supplier entity: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteSupplierEntity(string $userId): JsonResponse
    {
        try {
            $user = \App\Models\AllUsers\User::findOrFail($userId);

            // Check if it's a supplier entity user
            if ($user->role_as != 8) {
                return response()->json([
                    'status' => 400,
                    'message' => 'User is not a supplier entity'
                ], 400);
            }

            // Delete associated supplier record if exists
            $supplier = \App\Models\Pharmacy\Supplier::where('user_id', $userId)->first();
            if ($supplier) {
                $supplier->user_id = null;
                $supplier->save();
            }

            // Delete user account
            $user->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Supplier entity user deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete supplier entity: ' . $e->getMessage()
            ], 500);
        }
    }
}
