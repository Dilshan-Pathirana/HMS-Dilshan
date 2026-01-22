<?php

namespace App\Http\Controllers\Pharmacy\DashboardPOS;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Action\Pharmacy\DashboardPOS\DashboardDetails;

class DashboardController extends Controller
{
    public function getDashboardDetails(DashboardDetails $dashboardDetails): JsonResponse
    {
        return response()->json($dashboardDetails());
    }
}
