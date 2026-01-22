<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Repositories\PayrollRepositoryInterface;
use App\Domain\Repositories\AttendanceRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PayrollController extends Controller
{
    public function __construct(
        private PayrollRepositoryInterface $payrollRepository,
        private AttendanceRepositoryInterface $attendanceRepository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;

        if ($request->has('period')) {
            $payrolls = $this->payrollRepository->getByPeriod($request->period, $centerId);
        } else {
            $payrolls = $this->payrollRepository->getPendingByCenter($centerId);
        }

        return response()->json($payrolls);
    }

    public function generate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:users,id',
            'period' => 'required|string|date_format:Y-m',
            'base_salary' => 'required|numeric|min:0',
            'overtime' => 'nullable|numeric|min:0',
            'bonuses' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'attendance_adjustment' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if payroll already exists
        $existing = $this->payrollRepository->findByEmployeeAndPeriod(
            $request->employee_id,
            $request->period
        );

        if ($existing) {
            return response()->json(['message' => 'Payroll already exists for this period'], 409);
        }

        $data = $validator->validated();
        $data['center_id'] = $request->user()->center_id;
        
        // Calculate gross and net salary
        $grossSalary = $data['base_salary'] 
            + ($data['overtime'] ?? 0) 
            + ($data['bonuses'] ?? 0)
            + ($data['attendance_adjustment'] ?? 0);
        
        $netSalary = $grossSalary - ($data['deductions'] ?? 0);

        $data['gross_salary'] = $grossSalary;
        $data['net_salary'] = $netSalary;
        $data['status'] = 'pending';
        $data['generated_by'] = $request->user()->id;
        $data['generated_at'] = now();

        $payroll = $this->payrollRepository->create($data);

        return response()->json($payroll, 201);
    }

    public function show(int $id): JsonResponse
    {
        $payroll = $this->payrollRepository->findWithDisbursement($id);

        if (!$payroll) {
            return response()->json(['message' => 'Payroll not found'], 404);
        }

        return response()->json($payroll);
    }

    public function disburse(int $id): JsonResponse
    {
        $payroll = $this->payrollRepository->find($id);

        if (!$payroll) {
            return response()->json(['message' => 'Payroll not found'], 404);
        }

        if ($payroll->status === 'disbursed') {
            return response()->json(['message' => 'Payroll already disbursed'], 400);
        }

        $this->payrollRepository->markAsDisbursed($id);

        return response()->json(['message' => 'Payroll disbursed successfully']);
    }

    public function employeeSummary(int $employeeId): JsonResponse
    {
        $summary = $this->payrollRepository->getSummaryByEmployee($employeeId);

        return response()->json($summary);
    }

    public function attendance(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;
        
        if ($request->has('date')) {
            $attendance = $this->attendanceRepository->getByCenterAndDate(
                $centerId,
                Carbon::parse($request->date)
            );
        } else {
            $attendance = $this->attendanceRepository->getByCenterAndDate($centerId, now());
        }

        return response()->json($attendance);
    }

    public function checkIn(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if already checked in today
        $existing = $this->attendanceRepository->getByEmployeeAndDate(
            $request->employee_id,
            now()
        );

        if ($existing) {
            return response()->json(['message' => 'Already checked in today'], 409);
        }

        $attendance = $this->attendanceRepository->checkIn(
            $request->employee_id,
            $request->user()->center_id,
            now()
        );

        return response()->json($attendance, 201);
    }

    public function checkOut(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attendance_id' => 'required|exists:attendance,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updated = $this->attendanceRepository->checkOut($request->attendance_id, now());

        if (!$updated) {
            return response()->json(['message' => 'Attendance not found'], 404);
        }

        return response()->json(['message' => 'Checked out successfully']);
    }

    public function totalCost(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'period' => 'required|string|date_format:Y-m',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $centerId = $request->user()->center_id;
        $totalCost = $this->payrollRepository->getTotalCostByPeriod($centerId, $request->period);

        return response()->json(['total_cost' => $totalCost]);
    }
}
