<?php

namespace App\Http\Controllers\PatientAppointment;

use Illuminate\Http\Request;
use App\Response\CommonResponse;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\DoctorAppointment\GetAllAppointmentsFilter;
use App\Action\PatientAppointment\DeletePatientAppointment;
use App\Action\PatientAppointment\GetAllPatientAppointment;
use App\Action\PatientAppointment\PatientAppointmentChange;
use App\Action\PatientAppointment\CreatePatientSelfAppointment;
use App\Action\PatientAppointment\CreateAdminPatientAppointment;
use App\Action\PatientAppointment\GetUserIdToPatientAppointment;
use App\Http\Requests\PatientAppointment\PatientAppointmentCreateRequest;
use App\Http\Requests\PatientAppointment\PatientAppointmentUpdateRequest;

class PatientAppointmentController extends Controller
{
    public function createPatientAppointment(
        PatientAppointmentCreateRequest $request,
        CreatePatientSelfAppointment $createPatientSelfAppointment
    ): JsonResponse {
        $validatedPatientAppointmentCreateRequest = $request->validated();

        if ($validatedPatientAppointmentCreateRequest) {
            return response()->json($createPatientSelfAppointment($validatedPatientAppointmentCreateRequest));
        }

        return response()->json();
    }

    public function adminCreatePatientAppointment(
        PatientAppointmentCreateRequest $request,
        CreateAdminPatientAppointment $createAdminPatientAppointment
    ): JsonResponse {
        $validatedPatientAppointmentCreateRequest = $request->validated();

        if ($validatedPatientAppointmentCreateRequest) {
            return response()->json($createAdminPatientAppointment($validatedPatientAppointmentCreateRequest));
        }

        return response()->json();
    }

    public function getAllPatientAppointment(GetAllPatientAppointment $getAllPatientAppointment): JsonResponse
    {
        return response()->json($getAllPatientAppointment());
    }

    public function getPatientAppointmentByUserID(string $userId, GetUserIdToPatientAppointment $getUserIdToPatientAppointment): JsonResponse
    {
        return response()->json($getUserIdToPatientAppointment($userId));
    }

    public function deletePatientAppointment(string $id, DeletePatientAppointment $deletePatientAppointment): JsonResponse
    {
        $result = $deletePatientAppointment($id);

        return response()->json($result);
    }

    public function getAppointments(Request $request, GetAllAppointmentsFilter $allAppointmentsFilter): JsonResponse
    {
        $filters = $request->only(['branch_id', 'doctor_id', 'date', 'patient_name']);

        $result = $allAppointmentsFilter($filters);

        return response()->json($result);
    }

    public function changeAppointmentDate(string $patientUserId, PatientAppointmentUpdateRequest $request, PatientAppointmentChange $patientAppointmentChange): JsonResponse
    {
        $validatedAppointmentDateChangeRequest = $request->validated();

        if ($validatedAppointmentDateChangeRequest) {
            return response()->json($patientAppointmentChange($patientUserId, $validatedAppointmentDateChangeRequest));
        }

        return response()->json(CommonResponse::sendBadResponseWithMessage('new date cannot be empty'));
    }
}
