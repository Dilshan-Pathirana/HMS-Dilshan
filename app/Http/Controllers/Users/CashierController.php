<?php

namespace App\Http\Controllers\Users;

use App\Models\AllUsers\Cashier;
use App\Response\CommonResponse;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\User\Cashier\UpdateCashierUser;
use App\Action\User\Cashier\GetAllCashierUsers;
use App\Http\Requests\CashierUserUpdateRequest;
use App\Action\User\Cashier\CreateNewCashierUser;
use App\Http\Requests\User\CashierUserCreateRequest;
use App\Action\User\Cashier\DeleteExistingCashierUser;

class CashierController extends Controller
{
    public function createCashier(
        CashierUserCreateRequest $request,
        CreateNewCashierUser $createNewCashierUser
    ):JsonResponse {
        try {
            $validatedCashierCreateRequest = $request->validated();

            $request->validate([
                'photo' => 'file|mimes:pdf,doc,docx,jpg,png|max:2048',
                'nic_photo' => 'file|mimes:pdf,doc,docx,jpg,png|max:2048',
            ]);

            $filePathForPhoto = '';
            $filePathForNic = '';

            if ($request->hasFile('photo')) {
                $filePathForPhoto = $request->file('photo')->store('documents/cashier', 'public');
            }

            if ($request->hasFile('nic_photo')) {
                $filePathForNic = $request->file('nic_photo')->store('documents/cashier', 'public');
            }

            if ($validatedCashierCreateRequest) {
                return response()->json($createNewCashierUser(
                    $validatedCashierCreateRequest,
                    $filePathForPhoto,
                    $filePathForNic
                ));
            }

            return response()->json(CommonResponse::sendBadResponse());
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error creating cashier: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Internal server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getCashiersDetails(GetAllCashierUsers $getAllCashierUsers): JsonResponse
    {
        return response()->json($getAllCashierUsers());
    }

    public function updateCashier(
        $user_id,
        CashierUserUpdateRequest $request,
        UpdateCashierUser $updateCashierUser
    ): JsonResponse {
        $cashier = Cashier::where('user_id', $user_id)->firstOrFail();

        $validatedCashierUpdateRequest = $request->validated();

        $filePathForPhoto = null;
        $filePathForNic = null;

        if ($request->hasFile('photo')) {
            $filePathForPhoto = $request->file('photo')->store('documents/cashier', 'public');
        }

        if ($request->hasFile('nic_photo')) {
            $filePathForNic = $request->file('nic_photo')->store('documents/cashier', 'public');
        }

        return response()->json($updateCashierUser(
            $cashier,
            $validatedCashierUpdateRequest,
            $filePathForPhoto,
            $filePathForNic
        ));
    }

    public function deleteCashier(string $user_id, DeleteExistingCashierUser $deleteExistingCashierUser): JsonResponse
    {
        return response()->json($deleteExistingCashierUser($user_id));
    }
}
