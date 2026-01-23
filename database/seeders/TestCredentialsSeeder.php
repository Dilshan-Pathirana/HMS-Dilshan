<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;
use App\Models\AllUsers\User;

class TestCredentialsSeeder extends Seeder
{
    /**
     * Parse `public/test_credentials.txt` and create users.
     */
    public function run(): void
    {
        $path = public_path('test_credentials.txt');
        if (!File::exists($path)) {
            $this->command->warn('test_credentials.txt not found at ' . $path);
            return;
        }

        $content = File::get($path);
        $lines = preg_split('/\r?\n/', $content);

        $current = [
            'email' => null,
            'name' => null,
            'password' => null,
        ];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;

            if (str_starts_with($line, 'Email:')) {
                // when we hit a new Email and previous has data, flush it
                if (!empty($current['email'])) {
                    $this->createUserFromCurrent($current);
                    $current = ['email' => null, 'name' => null, 'password' => null];
                }
                $current['email'] = trim(substr($line, strlen('Email:')));
            } elseif (str_starts_with($line, 'Name:')) {
                $current['name'] = trim(substr($line, strlen('Name:')));
            } elseif (str_starts_with($line, 'Password:')) {
                $current['password'] = trim(substr($line, strlen('Password:')));
            }
        }

        // flush last
        if (!empty($current['email'])) {
            $this->createUserFromCurrent($current);
        }

        $this->command->info('✅ Test credentials seeding finished.');
    }

    protected function createUserFromCurrent(array $data): void
    {
        $email = $data['email'] ?? null;
        if (!$email) return;

        $name = $data['name'] ?? 'Test User';
        $password = $data['password'] ?? 'Test@123';

        // Attempt to split name into first/last if application uses first_name/last_name
        $first = $name;
        $last = null;
        if (str_contains($name, ' ')) {
            $parts = preg_split('/\s+/', $name);
            $first = array_shift($parts);
            $last = implode(' ', $parts);
        }

        // App user model namespace in this project appears to be App\Models\AllUsers\User
        $attributes = [
            'email' => $email,
        ];

        $values = [
            'password' => Hash::make($password),
        ];

        // set common name fields if they exist on the model
        try {
            $user = User::firstOrNew($attributes);
            if (isset($user->first_name)) $user->first_name = $first;
            if (isset($user->last_name) && $last !== null) $user->last_name = $last;
            if (isset($user->name) && empty($user->name)) $user->name = $name;
            $user->password = Hash::make($password);
            $user->email_verified_at = $user->email_verified_at ?? now();
            $user->save();

            $this->command->info("Created/updated: {$email}");
        } catch (\Exception $e) {
            $this->command->error("Failed to create user {$email}: " . $e->getMessage());
        }
    }
}
