<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AllUsers\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create or update Super Admin User
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@hospital.com'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'password' => Hash::make('password'),
                'role_as' => 1, // Super Admin role
            ]
        );

        echo "✅ Super Admin created:\n";
        echo "   Email: admin@hospital.com\n";
        echo "   Password: password\n";
        echo "   Role: Super Admin\n\n";

        echo "🎉 Database seeding completed successfully!\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "Login Credentials:\n";
        echo "  Email: admin@hospital.com\n";
        echo "  Password: password\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

        // Call legacy seeders if they exist
        try {
            $this->call([
                SuperAdminSeeder::class,
                BranchSeeder::class,
                DoctorSeeder::class,
                DoctorScheduleSeeder::class,
                ProductSeeder::class,
                SupplierProductSeeder::class,
                ShiftManagementSeeder::class,
                NotificationManagementSeeder::class,
                ConsultationQuestionBankSeeder::class,
                DiagnosisMasterSeeder::class,
            ]);
        } catch (\Exception $e) {
            echo "⚠️  Legacy seeders skipped (some may not exist)\n";
        }
    }
}
