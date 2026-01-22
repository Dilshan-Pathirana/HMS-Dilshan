<?php

namespace App\Http\Controllers\Hospital\Branch;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Action\Hospital\Branch\AddNewBranch;
use App\Action\Hospital\Branch\GetAllBranches;
use App\Action\Hospital\Branch\DeleteExistingBranch;
use App\Action\Hospital\Branch\UpdateExistingBranch;
use App\Http\Requests\Hospital\Branch\BranchFormRequest;
use App\Http\Requests\Hospital\Branch\BranchUpdateFormRequest;

class BranchController extends Controller
{
    public function createBranch(
        BranchFormRequest $request,
        AddNewBranch $addNewBranch
    ): JsonResponse {
        $validatedBranchRequest = $request->validated();

        if ($validatedBranchRequest) {
            $request->validate([
                'register_document' => 'required|file|mimes:pdf,doc,docx,jpg,png|max:2048',
            ]);

            $filePath = null;

            if ($request->hasFile('register_document')) {
                $filePath = $request->file('register_document')->store('documents/branches', 'public');
            }

            return response()->json($addNewBranch($validatedBranchRequest, $filePath));
        }

        return response()->json([]);
    }

    public function getBranches(GetAllBranches $getAllBranches): JsonResponse
    {
        return response()->json($getAllBranches());
    }

    public function updateBranch(
        string $branchId,
        BranchUpdateFormRequest $request,
        UpdateExistingBranch $updateExistingBranch
    ): JsonResponse {
        try {
            $validatedBranchUpdateRequest = $request->validated();

            if ($validatedBranchUpdateRequest) {
                if ($request->hasFile('register_document')) {
                    $request->validate([
                        'register_document' => 'file|mimes:pdf,doc,docx,jpg,png|max:2048',
                    ]);

                    $validatedBranchUpdateRequest['register_document'] = $request->file('register_document')->store('documents/branches', 'public');
                }

                return response()->json($updateExistingBranch($branchId, $validatedBranchUpdateRequest));
            }

            return response()->json(['message' => 'No valid data provided'], 400);
        } catch (\Exception $exception) {
            Log::error($exception->getMessage());

            return response()->json(['message' => 'An error occurred while updating the branch'], 500);
        }
    }

    public function deleteBranch(string $branchId, DeleteExistingBranch $deleteExistingBranch): JsonResponse
    {
        return response()->json($deleteExistingBranch($branchId));
    }
}
