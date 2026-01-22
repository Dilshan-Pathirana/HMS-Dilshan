<?php

namespace Database\Seeders;

use App\Models\Shift\Shift;
use Illuminate\Database\Seeder;

class ShiftManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Shift::factory()->count(10)->create();
    }
}
