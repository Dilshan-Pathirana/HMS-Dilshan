<?php

namespace App\Services;

use Random\RandomException;

class AuthenticatedUserTokenGenerator
{
    public static function getValidToken($user): string
    {
        // Role mappings aligned with useAuth.ts and database:
        // 1: Super Admin, 2: Branch Admin, 3: Doctor, 4: Nurse, 5: Patient, 6: Cashier, 7: Pharmacist
        $roleMapping = [
            1 => ['name' => '_SuperAdminToken', 'abilities' => ['server:super-admin']],
            2 => ['name' => '_AdminToken', 'abilities' => ['server:admin']],
            3 => ['name' => '_DoctorToken', 'abilities' => ['server:doctor']],
            4 => ['name' => '_NurseToken', 'abilities' => ['server:nurse']],
            5 => ['name' => '_PatientToken', 'abilities' => ['server:patient']],
            6 => ['name' => '_CashierToken', 'abilities' => ['server:cashier']],
            7 => ['name' => '_PharmacistToken', 'abilities' => ['server:pharmacist']],
            8 => ['name' => '_SupplierToken', 'abilities' => ['server:supplier']],
            9 => ['name' => '_ReceptionistToken', 'abilities' => ['server:receptionist']],
            10 => ['name' => '_ITAssistantToken', 'abilities' => ['server:it-assistant']],
        ];

        if (isset($roleMapping[$user->role_as])) {
            $tokenData = $roleMapping[$user->role_as];

            return $user->createToken($user->email.$tokenData['name'], $tokenData['abilities'])->plainTextToken;
        }

        return '';
    }

    /**
     * @throws RandomException
     */
    public static function getPassword(): string
    {
        $letters = 'abcdefghijkmnpqrstuvwxyz';
        $numbers = '123456789';

        $password = '';

        for ($i = 0; $i < 4; $i++) {
            $password .= $letters[random_int(0, strlen($letters) - 1)];
            $password .= $numbers[random_int(0, strlen($numbers) - 1)];
        }

        return $password;
    }
}
