<?php

namespace App\Http\Controllers\Users;

use App\Models\AllUsers\Doctor;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Action\User\Doctor\UpdateDoctorUser;
use App\Action\User\Doctor\GetAllDoctorUsers;
use App\Http\Requests\DoctorUserUpdateRequest;
use App\Action\User\Doctor\CreateNewDoctorUser;
use App\Action\DoctorSchedule\CancelDoctorSchedule;
use App\Action\DoctorSchedule\GetDoctorScheduleAll;
use App\Http\Requests\User\DoctorUserCreateRequest;
use App\Action\DoctorSchedule\CancelDoctorEntireDay;
use App\Action\User\Doctor\DeleteExistingDoctorUser;
use App\Action\DoctorSchedule\CancelDoctorAppointments;
use App\Action\DoctorSchedule\GetDoctorPatientAppointment;
use App\Http\Requests\DoctorAppointments\CancelDoctorDayRequest;
use App\Http\Requests\DoctorAppointments\CancelAppointmentsRequest;
use App\Http\Requests\DoctorAppointments\CancelDoctorScheduleRequest;

class DoctorController extends Controller
{
    public function createDoctor(
        DoctorUserCreateRequest $request,
        CreateNewDoctorUser $createNewDoctorUser
    ): JsonResponse {
        try {
            $validatedDoctorCreateRequest = $request->validated();

            $filePathForPhoto = null;
            $filePathForNic = null;

            return response()->json(
                $createNewDoctorUser($validatedDoctorCreateRequest, $filePathForPhoto, $filePathForNic)
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return validation errors with 422 status
            return response()->json([
                'status' => 422,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $exception) {
            Log::error('Error creating doctor: '.$exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);
            return response()->json(['status' => 500, 'message' => 'Internal Server Error'], 500);
        }
    }

    public function getDoctorsDetails(GetAllDoctorUsers $getAllDoctorUsers): JsonResponse
    {
        return response()->json($getAllDoctorUsers());
    }

    public function updateDoctor(
        $user_id,
        DoctorUserUpdateRequest $request,
        UpdateDoctorUser $updateDoctorUser
    ): JsonResponse {
        try {
            $doctor = Doctor::where('user_id', $user_id)->firstOrFail();

            $validatedDoctorUpdateRequest = $request->validated([]);

            $filePathForPhoto = null;
            $filePathForNic = null;

            if ($request->hasFile('photo')) {
                $filePathForPhoto = $request->file('photo')->store('documents/doctor', 'public');
            }

            if ($request->hasFile('nic_photo')) {
                $filePathForNic = $request->file('nic_photo')->store('documents/doctor', 'public');
            }

            return response()->json($updateDoctorUser(
                $doctor,
                $validatedDoctorUpdateRequest,
                $filePathForPhoto,
                $filePathForNic
            ));
        } catch (\Exception $exception) {
            Log::error('Error updating doctor: '.$exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json(['status' => 500, 'message' => 'Internal Server Error'], 500);
        }
    }

    public function deleteDoctor(string $user_id, DeleteExistingDoctorUser $deleteExistingDoctorUser): JsonResponse
    {
        return response()->json($deleteExistingDoctorUser($user_id));
    }

    public function getDoctorScheduleAll(string $user_id, GetDoctorScheduleAll $getDoctorScheduleAll): JsonResponse
    {
        return  response()->json($getDoctorScheduleAll($user_id));
    }

    public function getDoctorScheduleAppointments(
        string $user_id,
        string $branch_id,
        string $schedule_id,
        GetDoctorPatientAppointment $getDoctorPatientAppointment
    ): JsonResponse {
        return response()->json($getDoctorPatientAppointment($user_id, $branch_id, $schedule_id));
    }

    public function cancelDoctorAppointments(
        CancelAppointmentsRequest $request,
        CancelDoctorAppointments $cancelDoctorAppointments
    ): JsonResponse {
        $validatedDoctorAppointmentCancellation = $request->validated();

        return response()->json(
            $cancelDoctorAppointments(
                $validatedDoctorAppointmentCancellation
            )
        );
    }

    public function cancelSchedule(
        CancelDoctorScheduleRequest $request,
        CancelDoctorSchedule $cancelDoctorSchedule
    ): JsonResponse {
        $validatedDoctorScheduleCancellation = $request->validated();

        return response()->json(
            $cancelDoctorSchedule(
                $validatedDoctorScheduleCancellation
            )
        );
    }

    public function cancelEntireDay(
        CancelDoctorDayRequest $request,
        CancelDoctorEntireDay $cancelDoctorEntireDay
    ): JsonResponse {
        $validatedDoctorDayCancellation = $request->validated();

        return response()->json(
            $cancelDoctorEntireDay(
                $validatedDoctorDayCancellation
            )
        );
    }
}
