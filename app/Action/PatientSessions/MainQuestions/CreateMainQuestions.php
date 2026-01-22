<?php

namespace App\Action\PatientSessions\MainQuestions;

use Illuminate\Support\Str;
use App\Response\CommonResponse;
use App\Models\PatientSession\MainQuestions;

class CreateMainQuestions
{
    public function __invoke(array $request): array
    {
        MainQuestions::create([
            'id' => Str::uuid(),
            'doctor_id' => $request['doctor_id'],
            'question' => $request['question'],
            'description' => $request['description'],
            'order' => $request['order'],
            'status' => $request['status'],
        ]);

        return CommonResponse::sendSuccessResponse('Main question created successfully');
    }
}
