<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Pharmacy;
use App\Models\PharmacyInventory;
use App\Models\BranchUserAssignment;
use App\Models\AllUsers\User;
use Illuminate\Support\Facades\Hash;

class BranchPharmacySeeder extends Seeder
{
    public function run(): void
    {
        echo "🏥 Seeding branches with pharmacies and staff...\n\n";

        // Create 3 branches
        $branches = [
            [
                'center_name' => 'Colombo Medical Center',
                'register_number' => 'REG001',
                'center_type' => 'General Hospital',
                'owner_type' => 'Private',
                'owner_full_name' => 'Health Corp (Pvt) Ltd',
                'owner_id_number' => 'BRN-123456',
                'owner_contact_number' => '0112345678',
            ],
            [
                'center_name' => 'Kandy Health Complex',
                'register_number' => 'REG002',
                'center_type' => 'Specialty Clinic',
                'owner_type' => 'Private',
                'owner_full_name' => 'Central Medical Services',
                'owner_id_number' => 'BRN-234567',
                'owner_contact_number' => '0812345678',
            ],
            [
                'center_name' => 'Galle Care Hospital',
                'register_number' => 'REG003',
                'center_type' => 'General Hospital',
                'owner_type' => 'Private',
                'owner_full_name' => 'Southern Healthcare Ltd',
                'owner_id_number' => 'BRN-345678',
                'owner_contact_number' => '0912345678',
            ],
        ];

        $medications = [
            ['name' => 'Paracetamol', 'generic' => 'Acetaminophen', 'form' => 'Tablet', 'strength' => '500mg', 'manufacturer' => 'PharmaCorp'],
            ['name' => 'Amoxicillin', 'generic' => 'Amoxicillin', 'form' => 'Capsule', 'strength' => '250mg', 'manufacturer' => 'MediTech'],
            ['name' => 'Ibuprofen', 'generic' => 'Ibuprofen', 'form' => 'Tablet', 'strength' => '200mg', 'manufacturer' => 'HealthPlus'],
            ['name' => 'Omeprazole', 'generic' => 'Omeprazole', 'form' => 'Capsule', 'strength' => '20mg', 'manufacturer' => 'PharmaCorp'],
            ['name' => 'Metformin', 'generic' => 'Metformin HCl', 'form' => 'Tablet', 'strength' => '500mg', 'manufacturer' => 'MediTech'],
            ['name' => 'Aspirin', 'generic' => 'Acetylsalicylic Acid', 'form' => 'Tablet', 'strength' => '75mg', 'manufacturer' => 'HealthPlus'],
            ['name' => 'Ciprofloxacin', 'generic' => 'Ciprofloxacin', 'form' => 'Tablet', 'strength' => '500mg', 'manufacturer' => 'PharmaCorp'],
            ['name' => 'Losartan', 'generic' => 'Losartan Potassium', 'form' => 'Tablet', 'strength' => '50mg', 'manufacturer' => 'MediTech'],
            ['name' => 'Atorvastatin', 'generic' => 'Atorvastatin', 'form' => 'Tablet', 'strength' => '20mg', 'manufacturer' => 'HealthPlus'],
            ['name' => 'Cough Syrup', 'generic' => 'Dextromethorphan', 'form' => 'Syrup', 'strength' => '100ml', 'manufacturer' => 'PharmaCorp'],
        ];

        $roles = [
            'branch_admin' => 1,
            'doctor' => 4,
            'nurse' => 3,
            'pharmacist' => 2,
            'cashier' => 2,
            'receptionist' => 2,
            'it_support' => 1,
            'center_aid' => 2,
            'auditor' => 1,
        ];

        $branchCount = 0;
        $pharmacyCount = 0;
        $userCount = 0;
        $inventoryCount = 0;

        foreach ($branches as $branchData) {
            $branch = Branch::create($branchData);
            $branchCount++;
            echo "  ✓ Created branch: {$branch->center_name}\n";

            // Create 2-3 pharmacies per branch
            $numPharmacies = rand(2, 3);
            for ($p = 1; $p <= $numPharmacies; $p++) {
                $pharmacy = Pharmacy::create([
                    'branch_id' => $branch->id,
                    'pharmacy_name' => "{$branch->center_name} - Pharmacy {$p}",
                    'pharmacy_code' => strtoupper(substr($branch->center_name, 0, 3)) . "PH{$p}",
                    'license_number' => 'PHL' . rand(10000, 99999) . $p,
                    'license_expiry_date' => now()->addYears(2),
                    'phone' => '077' . rand(1000000, 9999999),
                    'email' => strtolower(str_replace(' ', '', $branch->center_name)) . ".pharmacy{$p}@hospital.com",
                    'location_in_branch' => ['Ground Floor', 'First Floor', 'Second Floor'][rand(0, 2)],
                    'operating_hours' => [
                        'monday' => '08:00-20:00',
                        'tuesday' => '08:00-20:00',
                        'wednesday' => '08:00-20:00',
                        'thursday' => '08:00-20:00',
                        'friday' => '08:00-20:00',
                        'saturday' => '09:00-17:00',
                        'sunday' => '09:00-14:00',
                    ],
                    'is_active' => true,
                ]);
                $pharmacyCount++;
                echo "    ✓ Created pharmacy: {$pharmacy->pharmacy_name}\n";

                // Add inventory to each pharmacy
                foreach ($medications as $med) {
                    PharmacyInventory::create([
                        'pharmacy_id' => $pharmacy->id,
                        'medication_name' => $med['name'],
                        'generic_name' => $med['generic'],
                        'dosage_form' => $med['form'],
                        'strength' => $med['strength'],
                        'manufacturer' => $med['manufacturer'],
                        'supplier' => ['Supplier A', 'Supplier B', 'Supplier C'][rand(0, 2)],
                        'batch_number' => 'BATCH' . rand(1000, 9999),
                        'expiration_date' => now()->addMonths(rand(6, 24)),
                        'quantity_in_stock' => rand(50, 500),
                        'reorder_level' => rand(10, 30),
                        'unit_cost' => rand(10, 200),
                        'selling_price' => rand(15, 300),
                        'discount_percentage' => rand(0, 15),
                        'storage_location' => 'Shelf-' . chr(rand(65, 72)) . rand(1, 9),
                        'is_active' => true,
                    ]);
                    $inventoryCount++;
                }
            }

            // Create staff for this branch
            foreach ($roles as $roleName => $count) {
                for ($i = 1; $i <= $count; $i++) {
                    $user = User::create([
                        'first_name' => ucfirst(str_replace('_', ' ', $roleName)),
                        'last_name' => chr(64 + $branchCount) . $i,
                        'email' => "{$roleName}{$i}.branch{$branchCount}@hospital.com",
                        'password' => Hash::make('password'),
                        'role_as' => $this->getRoleAsNumber($roleName),
                        'user_type' => ucfirst(str_replace('_', ' ', $roleName)),
                    ]);

                    // Assign user to branch
                    BranchUserAssignment::create([
                        'user_id' => $user->id,
                        'branch_id' => $branch->id,
                        'role' => $roleName,
                        'is_primary_branch' => true,
                        'assigned_date' => now(),
                        'is_active' => true,
                    ]);

                    $userCount++;
                }
            }

            // For doctors, assign some to multiple branches (30% chance)
            $doctors = BranchUserAssignment::where('branch_id', $branch->id)
                ->where('role', 'doctor')
                ->get();

            foreach ($doctors as $doctorAssignment) {
                if (rand(1, 100) <= 30 && $branchCount > 1) {
                    // Assign to one additional random branch
                    $otherBranches = Branch::where('id', '!=', $branch->id)->get();
                    if ($otherBranches->count() > 0) {
                        $otherBranch = $otherBranches->random();
                        BranchUserAssignment::create([
                            'user_id' => $doctorAssignment->user_id,
                            'branch_id' => $otherBranch->id,
                            'role' => 'doctor',
                            'is_primary_branch' => false,
                            'assigned_date' => now(),
                            'is_active' => true,
                        ]);
                    }
                }
            }

            echo "\n";
        }

        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "✅ Branch & Pharmacy System Seeded:\n";
        echo "   • Branches: {$branchCount}\n";
        echo "   • Pharmacies: {$pharmacyCount}\n";
        echo "   • Staff Members: {$userCount}\n";
        echo "   • Inventory Items: {$inventoryCount}\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    }

    private function getRoleAsNumber(string $role): int
    {
        $roleMap = [
            'super_admin' => 1,
            'branch_admin' => 2,
            'cashier' => 3,
            'pharmacist' => 4,
            'doctor' => 5,
            'receptionist' => 6,
            'nurse' => 7,
            'it_support' => 8,
            'center_aid' => 9,
            'auditor' => 10,
        ];

        return $roleMap[$role] ?? 0;
    }
}
