<?php

namespace App\Action\Hospital\Branch;

use App\Models\Hospital\Branch;
use App\Response\CommonResponse;
use App\Services\Branch\CheckBranchExisting;
use Symfony\Component\HttpFoundation\Response;

class DeleteExistingBranch
{
    public function __invoke(string $branchId): array
    {
        if (! CheckBranchExisting::check($branchId)) {
            return CommonResponse::sendBadResponseWithMessage('Branch id is not existing');
        }

        Branch::findOrFail($branchId)->delete();

        return [
             'status' => Response::HTTP_OK,
             'message' => 'Branch deleted successfully',
         ];
    }
}
