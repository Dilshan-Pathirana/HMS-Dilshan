<?php

namespace App\Http\Controllers\Users;

use App\Models\AllUsers\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class StaffController extends Controller
{
    /**
     * Create a new staff member
     */
    public function createStaff(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'phone' => 'required|string|max:20',
                'nic' => 'required|string|max:20|unique:users,nic',
                'date_of_birth' => 'required|date',
                'gender' => 'required|in:Male,Female,Other',
                'branch_id' => 'required|exists:branches,id',
                'address' => 'nullable|string',
                'user_type' => 'required|string',
                'joining_date' => 'required|date',
                'basic_salary' => 'required|numeric|min:0',
                'password' => 'required|string|min:6',
                'photo' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
                'nic_photo' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $filePathForPhoto = null;
            $filePathForNic = null;

            if ($request->hasFile('photo')) {
                $filePathForPhoto = $request->file('photo')->store('documents/staff', 'public');
            }

            if ($request->hasFile('nic_photo')) {
                $filePathForNic = $request->file('nic_photo')->store('documents/staff', 'public');
            }

            // Generate username from email
            $username = explode('@', $request->email)[0] . '_' . substr(uniqid(), -4);

            // Determine role_as based on user_type
            $roleAsMap = [
                'Branch Admin' => 2,
                'IT Assistant' => 8,
                'Center Aids' => 9,
                'Support Staff' => 9,
                'Receptionist' => 6,
                'Therapist' => 11,
                'Radiology/Imaging Technologist' => 12,
                'Medical Technologist' => 12,
                'Phlebotomist' => 12,
                'Surgical Technologist' => 12,
                'Counselor' => 11,
                'HRM Manager' => 13,
                'Dietitian' => 14,
                'Paramedic/EMT' => 15,
                'Audiologist' => 16,
                'Medical Assistant' => 17,
                'Clerk' => 18,
                'Director' => 19,
                'Secretary' => 20,
            ];
            $roleAs = $roleAsMap[$request->user_type] ?? 9; // Default to Center Aids role

            // Create user with provided password
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->last_name,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'username' => $username,
                'email' => $request->email,
                'phone' => $request->phone,
                'nic' => $request->nic,
                'date_of_birth' => $request->date_of_birth,
                'gender' => $request->gender,
                'branch_id' => $request->branch_id,
                'address' => $request->address,
                'user_type' => $request->user_type,
                'role_as' => $roleAs,
                'joining_date' => $request->joining_date,
                'basic_salary' => $request->basic_salary,
                'photo' => $filePathForPhoto,
                'nic_photo' => $filePathForNic,
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);

            return response()->json([
                'status' => 200,
                'message' => $request->user_type . ' created successfully. They can now login with their email and password.',
                'data' => $user
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Something went wrong while creating the user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get staff members for a specific branch (for Branch Admin)
     */
    public function getBranchStaff(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'status' => 401,
                    'message' => 'Unauthorized - user not authenticated',
                    'data' => []
                ], 401);
            }
            
            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'status' => 400,
                    'message' => 'No branch assigned to this user',
                    'data' => []
                ], 400);
            }

            // Get all users from this branch (excluding the current user)
            // Note: role_as 6 = Receptionist in seeded data
            $staff = User::with('branch')
                ->where('branch_id', $branchId)
                ->where('id', '!=', $user->id)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'first_name' => $user->first_name ?? '',
                        'last_name' => $user->last_name ?? '',
                        'email' => $user->email,
                        'phone' => $user->phone ?? '',
                        'gender' => $user->gender ?? '',
                        'date_of_birth' => $user->date_of_birth,
                        'address' => $user->address ?? '',
                        'profile_picture' => $user->profile_picture ?? $user->photo ?? '',
                        'role' => $user->user_type ?? $this->getRoleName($user->role_as),
                        'role_as' => $user->role_as,
                        'department' => $user->department ?? 'General',
                        'designation' => $user->designation ?? $user->user_type ?? '',
                        'employee_id' => $user->employee_id ?? 'EMP' . str_pad($user->id, 5, '0', STR_PAD_LEFT),
                        'joining_date' => $user->joining_date ?? $user->created_at?->format('Y-m-d'),
                        'employment_status' => $user->is_active ? 'active' : 'inactive',
                        'qualifications' => $user->qualifications ?? [],
                        'shift' => $user->shift ?? 'Day Shift',
                        'basic_salary' => $user->basic_salary ?? 0,
                    ];
                });

            return response()->json([
                'status' => 200,
                'data' => $staff
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch branch staff',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get role name from role_as value
     */
    private function getRoleName(int $roleAs): string
    {
        $roles = [
            1 => 'Super Admin',
            2 => 'Branch Admin',
            3 => 'Cashier',
            4 => 'Pharmacist',
            5 => 'Doctor',
            6 => 'Patient',
            7 => 'Nurse',
            8 => 'IT Support',
            9 => 'Center Aid',
            10 => 'Auditor',
        ];
        return $roles[$roleAs] ?? 'Staff';
    }

    /**
     * Get all staff members
     */
    public function getStaff(Request $request): JsonResponse
    {
        try {
            $userType = $request->query('user_type');
            
            $query = User::with('branch');
            
            if ($userType) {
                $query->where('user_type', $userType);
            } else {
                // Get all staff types except standard ones
                $query->whereNotIn('user_type', ['Doctor', 'Nurse', 'Cashier', 'Pharmacist', 'Patient']);
            }

            $staff = $query->get();

            return response()->json([
                'status' => 200,
                'data' => $staff
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch staff members',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update staff member
     */
    public function updateStaff(Request $request, $userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);

            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $userId,
                'phone' => 'sometimes|string|max:20',
                'nic' => 'sometimes|string|max:20|unique:users,nic,' . $userId,
                'date_of_birth' => 'sometimes|date',
                'gender' => 'sometimes|in:Male,Female,Other',
                'branch_id' => 'sometimes|exists:branches,id',
                'address' => 'nullable|string',
                'joining_date' => 'sometimes|date',
                'basic_salary' => 'sometimes|numeric|min:0',
                'photo' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
                'nic_photo' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($request->hasFile('photo')) {
                $user->photo = $request->file('photo')->store('documents/staff', 'public');
            }

            if ($request->hasFile('nic_photo')) {
                $user->nic_photo = $request->file('nic_photo')->store('documents/staff', 'public');
            }

            // Update fields
            $user->fill($request->except(['photo', 'nic_photo']));
            
            if ($request->has('first_name') || $request->has('last_name')) {
                $user->name = ($request->first_name ?? $user->first_name) . ' ' . ($request->last_name ?? $user->last_name);
            }

            $user->save();

            return response()->json([
                'status' => 200,
                'message' => 'Staff member updated successfully',
                'data' => $user
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update staff member',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete staff member
     */
    public function deleteStaff($userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);
            $user->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Staff member deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete staff member',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
