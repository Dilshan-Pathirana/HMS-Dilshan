<?php

namespace Database\Seeders;

use App\Models\Hospital\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Branch::factory()->count(10)->create();
    }
}
