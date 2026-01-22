<?php

namespace App\Http\Controllers\Users;

use App\Response\CommonResponse;
use Illuminate\Http\JsonResponse;
use App\Models\AllUsers\Pharmacist;
use App\Http\Controllers\Controller;
use App\Http\Requests\PharmacistUserUpdateRequest;
use App\Action\User\Pharmacist\UpdatePharmacistUser;
use App\Action\User\Pharmacist\GetAllPharmacistUsers;
use App\Action\User\Pharmacist\CreateNewPharmacistUser;
use App\Http\Requests\User\PharmacistUserCreateRequest;
use App\Action\User\Pharmacist\DeleteExistingPharmacistUser;

class PharmacistController extends Controller
{
    public function createPharmacist(
        PharmacistUserCreateRequest $request,
        CreateNewPharmacistUser $createNewPharmacistUser
    ):JsonResponse {
        try {
            $validatedPharmacistCreateRequest = $request->validated();

            $request->validate([
                'photo' => 'file|mimes:pdf,doc,docx,jpg,png|max:2048',
                'nic_photo' => 'file|mimes:pdf,doc,docx,jpg,png|max:2048',
            ]);

            $filePathForPhoto = '';
            $filePathForNic = '';

            if ($request->hasFile('photo')) {
                $filePathForPhoto = $request->file('photo')->store('documents/pharmacist', 'public');
            }

            if ($request->hasFile('nic_photo')) {
                $filePathForNic = $request->file('nic_photo')->store('documents/pharmacist', 'public');
            }

            if ($validatedPharmacistCreateRequest) {
                return response()->json($createNewPharmacistUser($validatedPharmacistCreateRequest, $filePathForPhoto, $filePathForNic));
            }

            return response()->json(CommonResponse::sendBadResponse());
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error creating pharmacist: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Internal server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getPharmacistsDetails(GetAllPharmacistUsers $getAllPharmacistUsers): JsonResponse
    {
        return response()->json($getAllPharmacistUsers());
    }

    public function updatePharmacist(
        $user_id,
        PharmacistUserUpdateRequest $request,
        UpdatePharmacistUser $updatePharmacistUser
    ): JsonResponse {
        $pharmacist = Pharmacist::where('user_id', $user_id)->firstOrFail();

        $validatedPharmacistUpdateRequest = $request->validated();

        $filePathForPhoto = null;
        $filePathForNic = null;

        if ($request->hasFile('photo')) {
            $filePathForPhoto = $request->file('photo')->store('documents/pharmacist', 'public');
        }

        if ($request->hasFile('nic_photo')) {
            $filePathForNic = $request->file('nic_photo')->store('documents/pharmacist', 'public');
        }

        return response()->json($updatePharmacistUser(
            $pharmacist,
            $validatedPharmacistUpdateRequest,
            $filePathForPhoto,
            $filePathForNic
        ));
    }

    public function deletePharmacist(string $userId, DeleteExistingPharmacistUser $deleteExistingPharmacistUser): JsonResponse
    {
        return response()->json($deleteExistingPharmacistUser($userId));
    }
}
