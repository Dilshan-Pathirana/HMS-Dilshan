<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HRM\EPFETFConfig;

class EPFETFConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Default Sri Lanka EPF/ETF rates
     */
    public function run(): void
    {
        EPFETFConfig::create([
            'epf_employee_rate' => 8.00,
            'epf_employer_rate' => 12.00,
            'etf_employer_rate' => 3.00,
            'epf_registration_number' => 'EPF/2024/001234',
            'etf_registration_number' => 'ETF/2024/005678',
            'company_name' => 'Cure Hospital Network',
            'company_address' => 'Colombo, Sri Lanka',
            'company_contact' => '+94 11 234 5678',
            'effective_from' => now(),
            'payment_due_date' => 15,
            'auto_calculate' => true,
            'is_active' => true,
        ]);

        $this->command->info('Created default EPF/ETF configuration (8%+12% EPF, 3% ETF)');
    }
}
