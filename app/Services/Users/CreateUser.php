<?php

namespace App\Services\Users;

use App\Models\AllUsers\User;
use Illuminate\Support\Facades\Hash;

class CreateUser
{
    public static function newUser(array $validateRequest, int $userRole): User
    {
        // Handle branch_id - it might be a JSON array string for doctors
        $branchId = $validateRequest['branch_id'] ?? null;
        
        if ($branchId) {
            // If it's a JSON array string, extract the first branch ID
            if (is_string($branchId) && str_starts_with($branchId, '[')) {
                $decoded = json_decode($branchId, true);
                if (is_array($decoded) && !empty($decoded)) {
                    $branchId = $decoded[0];
                }
            }
            // If it's already an array, get the first element
            elseif (is_array($branchId) && !empty($branchId)) {
                $branchId = $branchId[0];
            }
        }

        return User::create([
            'first_name' => $validateRequest['first_name'],
            'last_name' => $validateRequest['last_name'],
            'email' => $validateRequest['email'],
            'password' => Hash::make($validateRequest['password']),
            'role_as' => $userRole,
            'branch_id' => $branchId,
            'basic_salary' => $validateRequest['basic_salary'] ?? null,
        ]);
    }
}
