<?php

namespace App\Action\PatientSessions\MainQuestions;

use App\Response\CommonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\PatientSession\MainQuestions;

class UpdateMainQuestions
{
    public function __invoke(string $id, array $request): array
    {
        try {
            $mainQuestion = MainQuestions::find($id);

            if (! $mainQuestion) {
                return CommonResponse::sendBadResponseWithMessage('Main question not found');
            }

            $mainQuestion->update([
                'doctor_id' => $request['doctor_id'],
                'question' => $request['question'],
                'description' => $request['description'],
                'order' => $request['order'],
                'status' => $request['status'] ?? $mainQuestion->status,
            ]);

            return CommonResponse::sendSuccessResponse('Main question updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating main question: '.$e->getMessage());

            return CommonResponse::sendBadResponseWithMessage('Failed to update main question');
        }
    }
}
