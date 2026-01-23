<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
    protected $description = 'Clear all database tables except super admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('force')) {
            if (!$this->confirm('⚠️  This will DELETE all data except the super admin. Are you sure?')) {
                $this->info('Operation cancelled.');
                return 0;
            }
        }

        $this->info('Starting database cleanup...');

        try {
            DB::beginTransaction();

            // Store super admin data
            $superAdmin = DB::table('users')
                ->where('role_as', 1)
                ->first();

            if (!$superAdmin) {
                $this->error('No super admin found! Aborting operation.');
                DB::rollBack();
                return 1;
            }

            $this->info("Found super admin: {$superAdmin->email}");

            // Get all tables
            $tables = $this->getAllTables();
            
            // Tables to skip completely
            $skipTables = ['migrations', 'password_reset_tokens', 'sessions'];
            
            // Disable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            foreach ($tables as $table) {
                if (in_array($table, $skipTables)) {
                    $this->info("⏩ Skipping: {$table}");
                    continue;
                }

                if ($table === 'users') {
                    // Delete all users except super admin
                    $deleted = DB::table('users')
                        ->where('role_as', '!=', 1)
                        ->delete();
                    $this->info("✓ Users table: Deleted {$deleted} users (kept super admin)");
                } else {
                    // Truncate all other tables
                    DB::table($table)->truncate();
                    $this->info("✓ Truncated: {$table}");
                }
            }

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            DB::commit();

            $this->newLine();
            $this->info('✅ Database cleared successfully!');
            $this->info("✅ Super admin preserved: {$superAdmin->email}");
            
            return 0;

        } catch (\Exception $e) {
            DB::rollBack();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            $this->error('❌ Error: ' . $e->getMessage());
            $this->error('Operation rolled back.');
            
            return 1;
        }
    }

    /**
     * Get all table names in the database
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
