<?php

namespace App\Action\Shift;

use App\Models\Shift\Shift;
use App\Response\CommonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CreateShift
{
    public function __invoke(array $validated): array
    {
        DB::beginTransaction();
        try {
            $shift = Shift::create([
                 'user_id' => $validated['user_id'],
                 'branch_id' => $validated['branch_id'],
                 'shift_type' => $validated['shift_type'],
                'days_of_week' => $validated['days_of_week'],
                 'start_time' => $validated['start_time'],
                 'end_time' => $validated['end_time'],
                 'notes' => $validated['notes'],
             ]);

            DB::commit();

            $response = CommonResponse::sendSuccessResponse('Shift created successfully');
            $response['id'] = $shift->id;
            return $response;
        } catch (\Exception $e) {
            Log::error('CreateShift Error: '.$e->getMessage());
            DB::rollBack();

            return CommonResponse::sendBadResponse();
        }
    }
}
