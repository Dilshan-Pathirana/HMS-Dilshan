<?php

namespace App\Http\Controllers\Users;

use App\Response\CommonResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Action\User\Nurse\GetAllNurseUsers;
use App\Action\User\Nurse\CreateNewNurseUser;
use App\Http\Requests\User\NurseUserCreateRequest;

class NurseController extends Controller
{
    public function createNurse(
        NurseUserCreateRequest $request,
        CreateNewNurseUser $createNewNurseUser
    ):JsonResponse {
        try {
            $validatedNurseCreateRequest = $request->validated();

            if ($validatedNurseCreateRequest) {
                return response()->json($createNewNurseUser($validatedNurseCreateRequest));
            }

            return response()->json(CommonResponse::sendBadResponse());
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $exception) {
            Log::error('Error creating nurse: '.$exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);
            return response()->json(['status' => 500, 'message' => 'Internal Server Error'], 500);
        }
    }

    public function getNursesDetails(GetAllNurseUsers $getAllNurseUsers): JsonResponse
    {
        return response()->json($getAllNurseUsers());
    }
}
