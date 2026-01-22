<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Notification\NotificationManagement;

class NotificationManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        NotificationManagement::factory()->count(10)->create();
    }
}
