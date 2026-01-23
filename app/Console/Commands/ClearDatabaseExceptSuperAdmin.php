<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ClearDatabaseExceptSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:clear-except-superadmin {--force : Force the operation without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all database tables except the super admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('force')) {
            if (!$this->confirm('⚠️  This will DELETE all data except the super admin. Are you sure?')) {
                $this->info('Operation cancelled.');
                return Command::SUCCESS;
            }
        }

        $this->info('Starting database cleanup...');

        // Tables to skip entirely
        $skipTables = [
            'migrations',
            'password_reset_tokens',
            'sessions',
        ];

        try {
            // Fetch super admin
            $superAdmin = DB::table('users')
                ->where('role_as', 1)
                ->first();

            if (!$superAdmin) {
                $this->error('❌ No super admin found. Aborting operation.');
                return Command::FAILURE;
            }

            $this->info("Found super admin: {$superAdmin->email}");

            // Get all tables
            $tables = $this->getAllTables();

            // Disable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            foreach ($tables as $table) {
                if (in_array($table, $skipTables, true)) {
                    $this->info("⏩ Skipping: {$table}");
                    continue;
                }

                if ($table === 'users') {
                    $deleted = DB::table('users')
                        ->where('role_as', '!=', 1)
                        ->delete();

                    $this->info("✓ Users table: Deleted {$deleted} users (kept super admin)");
                    continue;
                }

                DB::table($table)->truncate();
                $this->info("✓ Truncated: {$table}");
            }

            $this->newLine();
            $this->info('✅ Database cleared successfully.');
            $this->info("✅ Super admin preserved: {$superAdmin->email}");

            return Command::SUCCESS;

        } catch (\Throwable $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            return Command::FAILURE;

        } finally {
            // Always re-enable FK checks
            try {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            } catch (\Throwable $e) {
                // Silent fail: do not mask original error
            }
        }
    }

    /**
     * Get all table names in the database.
     */
    private function getAllTables(): array
    {
        $tables = [];
        $results = DB::select('SHOW TABLES');

        $dbName = DB::getDatabaseName();
        $key = "Tables_in_{$dbName}";

        foreach ($results as $result) {
            $tables[] = $result->$key;
        }

        return $tables;
    }
}
