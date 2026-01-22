<?php

namespace App\Application\Services;

use App\Core\Exceptions\BusinessLogicException;
use App\Core\Exceptions\ResourceNotFoundException;
use App\Domain\Events\MedicationDispensedEvent;
use Illuminate\Support\Facades\DB;

/**
 * Pharmacy Service
 * Handles medication inventory, dispensing, and stock management
 */
class PharmacyService extends BaseService
{
    /**
     * Create new medication
     */
    public function createMedication(array $data): array
    {
        try {
            $this->validateRequired($data, [
                'medication_name', 'dosage_form', 'quantity_in_stock',
                'price_per_unit', 'center_id'
            ]);

            $medicationId = DB::table('medications')->insertGetId([
                'medication_name' => $data['medication_name'],
                'generic_name' => $data['generic_name'] ?? null,
                'brand_name' => $data['brand_name'] ?? null,
                'dosage_form' => $data['dosage_form'],
                'strength' => $data['strength'] ?? null,
                'quantity_in_stock' => $data['quantity_in_stock'],
                'reorder_level' => $data['reorder_level'] ?? 10,
                'expiration_date' => $data['expiration_date'] ?? null,
                'price_per_unit' => $data['price_per_unit'],
                'discount' => $data['discount'] ?? 0,
                'selling_price' => $this->calculateSellingPrice(
                    $data['price_per_unit'],
                    $data['discount'] ?? 0
                ),
                'center_id' => $data['center_id'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->log('info', 'Medication created', ['medication_id' => $medicationId]);

            return $this->getMedication($medicationId);

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get medication details
     */
    public function getMedication(int $medicationId): array
    {
        $medication = DB::table('medications')
            ->where('id', $medicationId)
            ->where('is_active', true)
            ->first();

        if (!$medication) {
            throw new ResourceNotFoundException('Medication', $medicationId);
        }

        return (array) $medication;
    }

    /**
     * Update medication inventory
     */
    public function updateInventory(int $medicationId, int $quantity, string $operation = 'add'): array
    {
        $medication = $this->getMedication($medicationId);

        $newQuantity = $operation === 'add'
            ? $medication['quantity_in_stock'] + $quantity
            : $medication['quantity_in_stock'] - $quantity;

        if ($newQuantity < 0) {
            throw new BusinessLogicException('Insufficient stock');
        }

        DB::table('medications')
            ->where('id', $medicationId)
            ->update([
                'quantity_in_stock' => $newQuantity,
                'updated_at' => now(),
            ]);

        // Check if reorder needed
        if ($newQuantity <= $medication['reorder_level']) {
            $this->createReorderAlert($medicationId, $newQuantity);
        }

        $this->log('info', "Inventory {$operation}", [
            'medication_id' => $medicationId,
            'quantity' => $quantity,
            'new_stock' => $newQuantity,
        ]);

        return $this->getMedication($medicationId);
    }

    /**
     * Dispense medication based on prescription
     */
    public function dispenseMedication(int $prescriptionId, int $pharmacistId): array
    {
        try {
            // Get prescription details
            $prescription = DB::table('prescriptions')->where('id', $prescriptionId)->first();

            if (!$prescription) {
                throw new ResourceNotFoundException('Prescription', $prescriptionId);
            }

            // Check if already dispensed
            $alreadyDispensed = DB::table('dispensing_records')
                ->where('prescription_id', $prescriptionId)
                ->exists();

            if ($alreadyDispensed) {
                throw new BusinessLogicException('Prescription already dispensed');
            }

            // Get medication details
            $medication = $this->getMedication($prescription->medication_id);

            // Calculate quantity needed (duration * frequency per day)
            $quantityNeeded = $this->calculateQuantityNeeded(
                $prescription->duration,
                $prescription->frequency
            );

            // Check stock availability
            if ($medication['quantity_in_stock'] < $quantityNeeded) {
                throw new BusinessLogicException('Insufficient medication stock');
            }

            // Create dispensing record
            $dispensingId = DB::table('dispensing_records')->insertGetId([
                'prescription_id' => $prescriptionId,
                'patient_id' => $prescription->patient_id,
                'medication_id' => $prescription->medication_id,
                'quantity_dispensed' => $quantityNeeded,
                'dispensed_by' => $pharmacistId,
                'dispense_date' => now(),
                'created_at' => now(),
            ]);

            // Update inventory
            $this->updateInventory($prescription->medication_id, $quantityNeeded, 'subtract');

            // Dispatch domain event
            $this->dispatchDomainEvent(new MedicationDispensedEvent(
                (string) $dispensingId,
                [
                    'prescription_id' => $prescriptionId,
                    'medication_id' => $prescription->medication_id,
                    'quantity' => $quantityNeeded,
                    'patient_id' => $prescription->patient_id,
                ]
            ));

            $this->log('info', 'Medication dispensed', [
                'dispensing_id' => $dispensingId,
                'prescription_id' => $prescriptionId,
            ]);

            return [
                'dispensing_id' => $dispensingId,
                'quantity_dispensed' => $quantityNeeded,
                'medication_name' => $medication['medication_name'],
            ];

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get low stock medications
     */
    public function getLowStockMedications(string $centerId): array
    {
        return DB::table('medications')
            ->where('center_id', $centerId)
            ->whereColumn('quantity_in_stock', '<=', 'reorder_level')
            ->where('is_active', true)
            ->get()
            ->toArray();
    }

    /**
     * Get medications expiring soon
     */
    public function getExpiringMedications(string $centerId, int $daysThreshold = 30): array
    {
        $expiryDate = now()->addDays($daysThreshold)->toDateString();

        return DB::table('medications')
            ->where('center_id', $centerId)
            ->where('expiration_date', '<=', $expiryDate)
            ->where('is_active', true)
            ->orderBy('expiration_date')
            ->get()
            ->toArray();
    }

    /**
     * Calculate selling price with discount
     */
    private function calculateSellingPrice(float $price, float $discount): float
    {
        return $price - ($price * ($discount / 100));
    }

    /**
     * Calculate quantity needed for prescription
     */
    private function calculateQuantityNeeded(int $duration, string $frequency): int
    {
        // Parse frequency (e.g., "3 times daily" -> 3)
        preg_match('/(\d+)/', $frequency, $matches);
        $timesPerDay = isset($matches[1]) ? (int) $matches[1] : 1;

        return $duration * $timesPerDay;
    }

    /**
     * Create reorder alert
     */
    private function createReorderAlert(int $medicationId, int $currentStock): void
    {
        DB::table('reorder_alerts')->insert([
            'medication_id' => $medicationId,
            'current_stock' => $currentStock,
            'alert_date' => now(),
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $this->log('warning', 'Reorder alert created', [
            'medication_id' => $medicationId,
            'current_stock' => $currentStock,
        ]);
    }
}
