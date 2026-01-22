<?php

namespace App\Http\Controllers\Profile;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Models\AllUsers\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Upload profile picture
     */
    public function uploadProfilePicture(Request $request, string $userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);

            $request->validate([
                'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            ]);

            // Delete old profile picture if exists
            if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
                Storage::disk('public')->delete($user->profile_picture);
            }

            // Store new profile picture
            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            
            $user->profile_picture = $path;
            $user->save();

            return response()->json([
                'status' => 200,
                'message' => 'Profile picture uploaded successfully',
                'data' => [
                    'profile_picture' => $path,
                    'image_url' => Storage::url($path)
                ]
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to upload profile picture: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove profile picture
     */
    public function removeProfilePicture(string $userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);

            // Delete profile picture file if exists
            if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
                Storage::disk('public')->delete($user->profile_picture);
            }

            $user->profile_picture = null;
            $user->save();

            return response()->json([
                'status' => 200,
                'message' => 'Profile picture removed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to remove profile picture: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change password
     */
    public function changePassword(Request $request, string $userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);

            $validated = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/',
                'new_password_confirmation' => 'required|string|same:new_password'
            ]);

            // Verify current password
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'status' => 401,
                    'message' => 'Current password is incorrect'
                ], 401);
            }

            // Check if new password is different from current
            if (Hash::check($validated['new_password'], $user->password)) {
                return response()->json([
                    'status' => 400,
                    'message' => 'New password must be different from current password'
                ], 400);
            }

            // Update password
            $user->password = Hash::make($validated['new_password']);
            $user->save();

            return response()->json([
                'status' => 200,
                'message' => 'Password changed successfully'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to change password: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update contact information
     */
    public function updateContactInfo(Request $request, string $userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);

            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255|unique:users,email,' . $userId . ',user_id',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
            ]);

            $user->fill($validated);
            $user->save();

            return response()->json([
                'status' => 200,
                'message' => 'Contact information updated successfully',
                'data' => $user
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update contact information: ' . $e->getMessage()
            ], 500);
        }
    }
}
