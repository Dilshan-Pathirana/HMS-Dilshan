<?php

namespace App\Http\Controllers\DoctorScheduleCancel;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\DoctorScheduleCancel\RejectCancellation;
use App\Action\DoctorScheduleCancel\ApproveCancellation;
use App\Action\DoctorScheduleCancel\GetAllDoctorScheduleCancel;
use App\Action\DoctorScheduleCancel\GetDoctorScheduleCancelById;
use App\Http\Requests\DoctorAppointments\RejectCancellationRequest;

class DoctorScheduleCancelController extends Controller
{
    public function getAllDoctorScheduleCancel(GetAllDoctorScheduleCancel $getAllDoctorScheduleCancel): JsonResponse
    {
        return response()->json($getAllDoctorScheduleCancel());
    }

    public function approveCancellation(string $id, ApproveCancellation $approveCancellation): JsonResponse
    {
        return response()->json($approveCancellation($id));
    }

    public function rejectCancellation(
        string $id,
        RejectCancellationRequest $request,
        RejectCancellation $rejectCancellation
    ): JsonResponse {
        return response()->json($rejectCancellation($id, $request->validated()));
    }

    public function getCancellationsByDoctorId($doctorId, GetDoctorScheduleCancelById $getDoctorScheduleCancelById): JsonResponse
    {
        return response()->json($getDoctorScheduleCancelById($doctorId));
    }
}
