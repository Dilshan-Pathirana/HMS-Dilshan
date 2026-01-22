<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Purchasing\DailyBill;

class DailyBillSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DailyBill::factory()->count(10)->create();
    }
}
