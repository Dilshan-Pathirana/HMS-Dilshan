<?php

namespace App\Action\Hospital\Branch;

use App\Models\Hospital\Branch;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Services\Branch\CheckBranchExisting;

class UpdateExistingBranch
{
    public function __invoke(
        string $branchId,
        array $validatedBranchUpdateRequest
    ): array {
        try {
            if (! CheckBranchExisting::check($branchId)) {
                return CommonResponse::sendBadResponseWithMessage('Branch id is not existing');
            }

            $branch = Branch::findOrFail($branchId);
            $branch->update($validatedBranchUpdateRequest);

            return CommonResponse::sendSuccessResponse('Branch updated successfully');
        } catch (\Exception $exception) {
            Log::error($exception->getMessage());

            return CommonResponse::sendBadResponse('An error occurred while updating the branch');
        }
    }
}
