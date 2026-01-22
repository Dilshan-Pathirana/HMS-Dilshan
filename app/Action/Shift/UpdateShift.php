<?php

namespace App\Action\Shift;

use App\Models\Shift\Shift;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateShift
{
    public function __invoke(array $data, string $id): array
    {
        DB::beginTransaction();

        try {
            $shift = Shift::findOrFail($id);

            $shift->update([
                'user_id' => $data['user_id'],
                'branch_id' => $data['branch_id'],
                'shift_type' => $data['shift_type'],
                'days_of_week' => $data['days_of_week'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'notes' => $data['notes'],
            ]);

            DB::commit();

            return CommonResponse::sendSuccessResponse('Shift updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('UpdateShift Error: '.$e->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
