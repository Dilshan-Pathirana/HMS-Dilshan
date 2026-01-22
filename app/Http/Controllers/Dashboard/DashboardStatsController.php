<?php

namespace App\Http\Controllers\Dashboard;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Models\AllUsers\User;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;

class DashboardStatsController extends Controller
{
    /**
     * Get Super Admin dashboard statistics
     */
    public function getSuperAdminStats(): JsonResponse
    {
        try {
            $stats = [
                'totalUsers' => User::count(),
                'totalBranches' => Branch::count(),
                'totalPatients' => User::where('role_as', 6)->count(),
                'todayAppointments' => 0, // TODO: Implement appointments
                'monthlyRevenue' => 0, // TODO: Implement revenue calculation
                'activeStaff' => User::whereIn('role_as', [1, 2, 3, 4, 5])
                    ->where('is_active', 1)
                    ->count(),
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Doctor dashboard statistics
     */
    public function getDoctorStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'todayAppointments' => 0, // TODO: Implement
                'pendingAppointments' => 0,
                'completedAppointments' => 0,
                'totalPatients' => 0,
                'pendingPrescriptions' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Pharmacist dashboard statistics
     */
    public function getPharmacistStats(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'status' => 401,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            $branchId = $user->branch_id ?? null;
            
            // Get branch details - wrapped in try-catch for safety
            $branch = null;
            $branchInfo = null;
            try {
                if ($branchId) {
                    $branch = Branch::find($branchId);
                    if ($branch) {
                        $branchInfo = [
                            'id' => $branch->id,
                            'center_name' => $branch->center_name ?? 'Unknown Branch',
                            'center_type' => $branch->center_type ?? '',
                            'register_number' => $branch->register_number ?? '',
                            'owner_full_name' => $branch->owner_full_name ?? '',
                            'owner_contact_number' => $branch->owner_contact_number ?? '',
                            'division' => $branch->division ?? null,
                            'division_number' => $branch->division_number ?? null,
                        ];
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to fetch branch info: ' . $e->getMessage());
            }
            
            // Get product count for the branch - wrapped in try-catch for safety
            $totalProducts = 0;
            $lowStockItems = 0;
            try {
                if ($branchId) {
                    $totalProducts = DB::table('products')
                        ->whereExists(function ($query) use ($branchId) {
                            $query->select(DB::raw(1))
                                ->from('suppliers')
                                ->whereColumn('suppliers.id', 'products.supplier_id')
                                ->where('suppliers.branch_id', $branchId);
                        })
                        ->count();
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to fetch product count: ' . $e->getMessage());
            }
            
            $stats = [
                'totalProducts' => $totalProducts,
                'lowStockItems' => $lowStockItems,
                'todaysSales' => 0,
                'pendingPrescriptions' => 0,
                'monthlyRevenue' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats,
                'branch' => $branchInfo,
                'user' => [
                    'id' => $user->id,
                    'name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: 'Pharmacist',
                    'email' => $user->email ?? '',
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Pharmacist dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage(),
                'data' => [
                    'totalProducts' => 0,
                    'lowStockItems' => 0,
                    'todaysSales' => 0,
                    'pendingPrescriptions' => 0,
                    'monthlyRevenue' => 0,
                ],
                'branch' => null,
                'user' => null
            ], 200); // Return 200 with empty data instead of 500 to prevent frontend crash
        }
    }

    /**
     * Get Cashier dashboard statistics
     */
    public function getCashierStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'todaysTransactions' => 0, // TODO: Implement
                'todaysRevenue' => 0,
                'pendingPayments' => 0,
                'processedBills' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Patient dashboard statistics
     */
    public function getPatientStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'upcomingAppointments' => 0, // TODO: Implement
                'totalAppointments' => 0,
                'activePrescriptions' => 0,
                'outstandingBalance' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Supplier dashboard statistics
     */
    public function getSupplierStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'totalOrders' => 0, // TODO: Implement
                'pendingOrders' => 0,
                'totalProducts' => 0,
                'monthlyRevenue' => 0,
                'completedOrders' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Receptionist dashboard statistics
     */
    public function getReceptionistStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'todayAppointments' => 0, // TODO: Implement
                'pendingAppointments' => 0,
                'registeredPatients' => User::where('role_as', 6)->count(),
                'todayVisitors' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Nurse dashboard statistics
     */
    public function getNurseStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'assignedPatients' => 0, // TODO: Implement
                'pendingMedications' => 0,
                'vitalSignsRecorded' => 0,
                'criticalAlerts' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get IT Assistant dashboard statistics
     */
    public function getITAssistantStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'openTickets' => 0, // TODO: Implement
                'systemsOnline' => 3, // Placeholder: Database, Application, Backup
                'securityAlerts' => 0,
                'activeUsers' => User::where('is_active', 1)->count(),
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Clerk dashboard statistics
     */
    public function getClerkStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'pendingFiles' => 0, // TODO: Implement
                'processedToday' => 0,
                'totalRecords' => 0,
                'archiveCount' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Director dashboard statistics
     */
    public function getDirectorStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'totalRevenue' => 0, // TODO: Implement
                'totalStaff' => User::whereIn('role_as', [1, 2, 3, 4, 5])
                    ->where('is_active', 1)
                    ->count(),
                'branches' => Branch::count(),
                'patients' => User::where('role_as', 6)->count(),
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Secretary dashboard statistics
     */
    public function getSecretaryStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'todayMeetings' => 0, // TODO: Implement
                'pendingEmails' => 0,
                'phoneCalls' => 0,
                'documentsProcessed' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Paramedic dashboard statistics
     */
    public function getParamedicStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'activeEmergencies' => 0, // TODO: Implement
                'responsesCompleted' => 0,
                'averageResponseTime' => 0,
                'equipmentStatus' => 100,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Audiologist dashboard statistics
     */
    public function getAudiologistStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'todayAppointments' => 0, // TODO: Implement
                'testsCompleted' => 0,
                'pendingResults' => 0,
                'equipmentCalibrated' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Medical Assistant dashboard statistics
     */
    public function getMedicalAssistantStats(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $stats = [
                'patientsAssisted' => 0, // TODO: Implement
                'vitalsRecorded' => 0,
                'labSamplesCollected' => 0,
                'pendingTasks' => 0,
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Branch Admin dashboard statistics
     */
    public function getBranchAdminStats(): JsonResponse
    {
        try {
            $user = auth()->user();
            $branchId = $user->branch_id ?? null;

            // Get branch details
            $branchInfo = null;
            if ($branchId) {
                $branch = Branch::find($branchId);
                if ($branch) {
                    $branchInfo = [
                        'id' => $branch->id,
                        'center_name' => $branch->center_name ?? 'Unknown Branch',
                        'center_type' => $branch->center_type ?? '',
                        'register_number' => $branch->register_number ?? '',
                    ];
                }
            }

            // Count pending schedule requests for this branch
            $pendingScheduleRequests = 0;
            try {
                $pendingScheduleRequests = DB::table('approval_requests')
                    ->where('request_type', 'doctor_schedule')
                    ->where('status', 'pending')
                    ->where('request_data', 'LIKE', '%"branch_id":"' . $branchId . '"%')
                    ->count();
            } catch (\Exception $e) {
                \Log::warning('Failed to count pending schedule requests: ' . $e->getMessage());
            }

            // Count total staff in this branch
            $totalStaff = 0;
            try {
                if ($branchId) {
                    $totalStaff = User::where('branch_id', $branchId)
                        ->where('is_active', 1)
                        ->count();
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to count staff: ' . $e->getMessage());
            }

            // Count doctors in this branch
            $totalDoctors = 0;
            try {
                if ($branchId) {
                    $totalDoctors = User::where('branch_id', $branchId)
                        ->where('role_as', 2) // Doctor role
                        ->where('is_active', 1)
                        ->count();
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to count doctors: ' . $e->getMessage());
            }

            // Count approved schedules for this branch
            $approvedSchedules = 0;
            try {
                $approvedSchedules = DB::table('doctor_schedules')
                    ->where('branch_id', $branchId)
                    ->count();
            } catch (\Exception $e) {
                \Log::warning('Failed to count approved schedules: ' . $e->getMessage());
            }

            $stats = [
                'totalStaff' => $totalStaff,
                'totalDoctors' => $totalDoctors,
                'pendingScheduleRequests' => $pendingScheduleRequests,
                'approvedSchedules' => $approvedSchedules,
                'pendingLeaveRequests' => 0, // TODO: Implement
                'todayAppointments' => 0, // TODO: Implement
            ];

            return response()->json([
                'status' => 200,
                'data' => $stats,
                'branch' => $branchInfo,
                'user' => [
                    'id' => $user->id,
                    'name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: 'Branch Admin',
                    'email' => $user->email ?? '',
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Branch Admin dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }
}
