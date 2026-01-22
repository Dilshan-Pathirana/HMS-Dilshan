<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\AllUsers\User;

class TestUserCredentialsSeeder extends Seeder
{
    /**
     * Reset all user passwords to Test@123 and generate credentials file
     */
    public function run(): void
    {
        $password = 'Test@123';
        $hashedPassword = Hash::make($password);
        
        // Update all users with the test password
        User::query()->update(['password' => $hashedPassword]);
        
        // Get all users for the credentials file
        $users = User::select('email', 'first_name', 'last_name', 'role_as', 'user_type')->get();
        
        // Role mapping
        $roleMap = [
            1 => 'Super Admin',
            2 => 'Branch Admin',
            3 => 'Cashier',
            4 => 'Pharmacist',
            5 => 'Doctor',
            6 => 'Receptionist/Patient',
            7 => 'Nurse',
            8 => 'IT Support/Supplier',
            9 => 'Center Aid',
            10 => 'Auditor',
        ];
        
        // Generate credentials content
        $content = "==============================================\n";
        $content .= "    HOSPITAL MANAGEMENT SYSTEM - TEST USERS\n";
        $content .= "==============================================\n";
        $content .= "Generated: " . now()->format('Y-m-d H:i:s') . "\n";
        $content .= "Default Password for ALL users: Test@123\n";
        $content .= "==============================================\n\n";
        
        // Group users by role
        $groupedUsers = $users->groupBy('role_as');
        
        foreach ($groupedUsers as $roleId => $roleUsers) {
            $roleName = $roleMap[$roleId] ?? "Role $roleId";
            $content .= "----------------------------------------------\n";
            $content .= strtoupper($roleName) . " (" . count($roleUsers) . " users)\n";
            $content .= "----------------------------------------------\n";
            
            foreach ($roleUsers as $user) {
                $fullName = trim($user->first_name . ' ' . $user->last_name);
                $userType = $user->user_type ? " [{$user->user_type}]" : "";
                $content .= "Email: {$user->email}\n";
                $content .= "Name: {$fullName}{$userType}\n";
                $content .= "Password: {$password}\n\n";
            }
        }
        
        $content .= "==============================================\n";
        $content .= "               END OF CREDENTIALS\n";
        $content .= "==============================================\n";
        
        // Save to public folder for download
        $filePath = public_path('test_credentials.txt');
        file_put_contents($filePath, $content);
        
        $this->command->info("✅ All {$users->count()} user passwords reset to: Test@123");
        $this->command->info("✅ Credentials file saved to: public/test_credentials.txt");
        $this->command->info("📥 Download from: http://localhost:8000/test_credentials.txt");
    }
}
