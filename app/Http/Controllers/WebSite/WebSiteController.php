<?php

namespace App\Http\Controllers\WebSite;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\WebSite\GetAllDoctorSchedulesForPatients;

class WebSiteController extends Controller
{
    public function getDoctorSchedules(Request $request, GetAllDoctorSchedulesForPatients $allDoctorSchedulesFilter): JsonResponse
    {
        $filters = $request->only(['branch_id', 'doctor_id', 'date', 'areas_of_specialization']);

        $result = $allDoctorSchedulesFilter($filters);

        return response()->json($result);
    }
}
