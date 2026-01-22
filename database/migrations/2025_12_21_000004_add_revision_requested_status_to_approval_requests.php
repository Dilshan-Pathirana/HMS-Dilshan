<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For SQLite, we need to recreate the table since it doesn't support modifying enum
        // First, check if we're using SQLite
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite approach: Create a new table with the updated schema
            Schema::create('approval_requests_new', function (Blueprint $table) {
                $table->id();
                $table->string('requested_by');
                $table->string('action', 50);
                $table->string('entity_type', 50);
                $table->text('request_data');
                $table->text('reason')->nullable();
                $table->string('status')->default('pending'); // Changed from enum to string
                $table->string('approved_by')->nullable();
                $table->text('approval_notes')->nullable();
                $table->timestamp('requested_at')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
                
                $table->index('status');
                $table->index('requested_at');
            });
            
            // Copy data from old table to new table
            DB::statement('INSERT INTO approval_requests_new SELECT * FROM approval_requests');
            
            // Drop old table
            Schema::dropIfExists('approval_requests');
            
            // Rename new table to original name
            Schema::rename('approval_requests_new', 'approval_requests');
        } else {
            // MySQL/PostgreSQL approach
            DB::statement("ALTER TABLE approval_requests MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'revision_requested') DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver !== 'sqlite') {
            DB::statement("ALTER TABLE approval_requests MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
        }
    }
};
