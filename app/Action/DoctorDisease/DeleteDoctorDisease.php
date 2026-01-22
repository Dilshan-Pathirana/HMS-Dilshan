<?php

namespace App\Action\DoctorDisease;

use Exception;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorCreatedDisease\DoctorCreatedDisease;

class DeleteDoctorDisease
{
    public function __invoke(string $id): array
    {
        try {
            $disease = DoctorCreatedDisease::find($id);

            if (! $disease) {
                return CommonResponse::sendBadResponseWithMessage('Disease not found');
            }

            $disease->delete();

            return CommonResponse::sendSuccessResponse('Disease deleted successfully');
        } catch (Exception $e) {
            Log::error('Error deleting doctor disease: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('Failed to delete disease');
        }
    }
}
