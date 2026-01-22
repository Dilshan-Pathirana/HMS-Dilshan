<?php

namespace App\Http\Controllers\Users;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\User\AllUser\GetAllUsers;
use App\Action\User\AllUser\GetAllUsersWithSalary;
use App\Action\User\AllUser\GetAllUserDetailsForUpdate;

class AllUserController extends Controller
{
    public function getAllUsers(GetAllUsers $getAllUsers): JsonResponse
    {
        return response()->json($getAllUsers());
    }

    public function getAllUsersWithSalary(GetAllUsersWithSalary $getAllUsersWithOT): JsonResponse
    {
        return response()->json($getAllUsersWithOT());
    }

    public function getUserDetailsForUpdate(GetAllUserDetailsForUpdate $getAllUserDetailsForUpdate, string $userId): JsonResponse
    {
        return response()->json($getAllUserDetailsForUpdate($userId));
    }
}
