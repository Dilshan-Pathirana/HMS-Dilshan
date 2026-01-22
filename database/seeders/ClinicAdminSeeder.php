<?php

namespace Database\Seeders;

use App\Models\AllUsers\User;
use Illuminate\Database\Seeder;

class ClinicAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::factory()->create([
            'role_as' => 2,
        ]);
    }
}
