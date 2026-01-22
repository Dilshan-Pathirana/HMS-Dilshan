<?php

namespace App\Action\Shift;

use App\Models\Shift\Shift;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;

class DeleteShift
{
    public function __invoke(string $id): array
    {
        try {
            $shift = Shift::findOrFail($id);
            $shift->delete();

            return CommonResponse::sendSuccessResponse('Shift deleted successfully');
        } catch (\Exception $e) {
            Log::error('DeleteShift Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
