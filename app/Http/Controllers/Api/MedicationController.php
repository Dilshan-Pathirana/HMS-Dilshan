<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Repositories\MedicationRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class MedicationController extends Controller
{
    public function __construct(
        private MedicationRepositoryInterface $medicationRepository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;

        if ($request->has('search')) {
            $medications = $this->medicationRepository->search(
                $request->search,
                $centerId,
                $request->per_page ?? 15
            );
        } else {
            $medications = $this->medicationRepository->getActiveByCenter($centerId);
        }

        return response()->json($medications);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'medication_name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'brand_name' => 'nullable|string|max:255',
            'dosage_form' => 'required|in:tablet,capsule,syrup,injection,drops,cream,ointment,inhaler',
            'strength' => 'required|string|max:50',
            'quantity_in_stock' => 'required|integer|min:0',
            'reorder_level' => 'integer|min:1',
            'expiration_date' => 'required|date|after:today',
            'batch_number' => 'nullable|string|max:100',
            'manufacturer' => 'nullable|string|max:255',
            'supplier' => 'nullable|string|max:255',
            'price_per_unit' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['center_id'] = $request->user()->center_id;
        
        // Calculate selling price
        $discount = $data['discount'] ?? 0;
        $data['selling_price'] = $data['price_per_unit'] * (1 - ($discount / 100));

        $medication = $this->medicationRepository->create($data);

        return response()->json($medication, 201);
    }

    public function show(int $id): JsonResponse
    {
        $medication = $this->medicationRepository->find($id);

        if (!$medication) {
            return response()->json(['message' => 'Medication not found'], 404);
        }

        return response()->json($medication);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'medication_name' => 'string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'brand_name' => 'nullable|string|max:255',
            'dosage_form' => 'in:tablet,capsule,syrup,injection,drops,cream,ointment,inhaler',
            'strength' => 'string|max:50',
            'quantity_in_stock' => 'integer|min:0',
            'reorder_level' => 'integer|min:1',
            'expiration_date' => 'date|after:today',
            'price_per_unit' => 'numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        
        // Recalculate selling price if needed
        if (isset($data['price_per_unit']) || isset($data['discount'])) {
            $medication = $this->medicationRepository->find($id);
            $price = $data['price_per_unit'] ?? $medication->price_per_unit;
            $discount = $data['discount'] ?? $medication->discount;
            $data['selling_price'] = $price * (1 - ($discount / 100));
        }

        $medication = $this->medicationRepository->update($id, $data);

        if (!$medication) {
            return response()->json(['message' => 'Medication not found'], 404);
        }

        return response()->json($medication);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->medicationRepository->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Medication not found'], 404);
        }

        return response()->json(['message' => 'Medication deleted successfully']);
    }

    public function lowStock(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;
        $medications = $this->medicationRepository->getLowStock($centerId);

        return response()->json($medications);
    }

    public function expiringSoon(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;
        $days = $request->days ?? 30;
        $medications = $this->medicationRepository->getExpiringSoon($centerId, $days);

        return response()->json($medications);
    }

    public function updateStock(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updated = $this->medicationRepository->updateStock($id, $request->quantity);

        if (!$updated) {
            return response()->json(['message' => 'Medication not found'], 404);
        }

        return response()->json(['message' => 'Stock updated successfully']);
    }

    public function inventoryValue(Request $request): JsonResponse
    {
        $centerId = $request->user()->center_id;
        $value = $this->medicationRepository->getInventoryValue($centerId);

        return response()->json(['inventory_value' => $value]);
    }
}
