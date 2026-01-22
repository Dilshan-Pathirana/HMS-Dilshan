<?php

namespace App\Http\Controllers\DoctorSession;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\DoctorSession\CreateDoctorSession;
use App\Action\DoctorSession\GetDoctorSessionsByDoctor;
use App\Http\Requests\DoctorSession\DoctorSessionRequest;

class DoctorSessionController extends Controller
{
    public function addDoctorSession(DoctorSessionRequest $request, CreateDoctorSession $createDoctorSession): JsonResponse
    {
        $validated = $request->validated();

        return response()->json($createDoctorSession($validated));
    }

    public function getDoctorSessionsByDoctor(string $doctorId, GetDoctorSessionsByDoctor $getDoctorSessionsByDoctor): JsonResponse
    {
        return response()->json($getDoctorSessionsByDoctor($doctorId));
    }
}
