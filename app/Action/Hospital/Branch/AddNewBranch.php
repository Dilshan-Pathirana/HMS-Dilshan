<?php

namespace App\Action\Hospital\Branch;

use Illuminate\Support\Str;
use App\Models\Hospital\Branch;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;

class AddNewBranch
{
    public function __invoke(array $validatedRequest, $filePath): array
    {
        try {
            Branch::create([
                'id' => Str::uuid(),
                'center_name' => $validatedRequest['center_name'],
                'register_number' => $validatedRequest['register_number'],
                'register_document' => $filePath,
                'center_type' => $validatedRequest['center_type'],
                'division' => $validatedRequest['division'],
                'division_number' => $validatedRequest['division_number'],
                'owner_type' => $validatedRequest['owner_type'],
                'owner_full_name' => $validatedRequest['owner_full_name'],
                'owner_id_number' => $validatedRequest['owner_id_number'],
                'owner_contact_number' => $validatedRequest['owner_contact_number'],
            ]);

            return CommonResponse::sendSuccessResponse('Branch create successfully');
        } catch (\Exception $exception) {
            Log::error($exception->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
