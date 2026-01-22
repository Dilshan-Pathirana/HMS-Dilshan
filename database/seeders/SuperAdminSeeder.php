<?php

namespace Database\Seeders;

use App\Models\AllUsers\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::factory()->create([
            'password' => '12345678',
            'role_as' => 1,
        ]);
    }
}
