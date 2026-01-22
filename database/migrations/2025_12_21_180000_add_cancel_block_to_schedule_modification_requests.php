<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * For SQLite, we need to recreate the table since SQLite doesn't support
     * modifying enum/CHECK constraints directly.
     */
    public function up(): void
    {
        // For SQLite, we need to recreate the table
        if (config('database.default') === 'sqlite') {
            // 1. Rename current table
            Schema::rename('schedule_modification_requests', 'schedule_modification_requests_old');
            
            // 2. Create new table with updated constraint
            Schema::create('schedule_modification_requests', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('doctor_id');
                $table->uuid('branch_id');
                $table->uuid('schedule_id')->nullable();
                $table->uuid('parent_request_id')->nullable(); // For cancel_block to reference the original request
                
                // Type of modification request - now includes cancel_block
                $table->string('request_type'); // Changed from enum to string for flexibility
                
                // Date range for the modification
                $table->date('start_date');
                $table->date('end_date')->nullable();
                
                // Modification details
                $table->time('new_start_time')->nullable();
                $table->time('new_end_time')->nullable();
                $table->integer('new_max_patients')->nullable();
                
                // Request details
                $table->text('reason');
                $table->string('status')->default('pending');
                
                // Approval details
                $table->uuid('approved_by')->nullable();
                $table->text('approval_notes')->nullable();
                $table->timestamp('approved_at')->nullable();
                
                $table->timestamps();
            });
            
            // 3. Copy data from old table
            DB::statement('
                INSERT INTO schedule_modification_requests (id, doctor_id, branch_id, schedule_id, parent_request_id, request_type, start_date, end_date, new_start_time, new_end_time, new_max_patients, reason, status, approved_by, approval_notes, approved_at, created_at, updated_at)
                SELECT id, doctor_id, branch_id, schedule_id, parent_request_id, request_type, start_date, end_date, new_start_time, new_end_time, new_max_patients, reason, status, approved_by, approval_notes, approved_at, created_at, updated_at
                FROM schedule_modification_requests_old
            ');
            
            // 4. Drop old table
            Schema::dropIfExists('schedule_modification_requests_old');
        } else {
            // For MySQL/PostgreSQL, we can alter the column
            Schema::table('schedule_modification_requests', function (Blueprint $table) {
                // Change the request_type column to include cancel_block
                $table->string('request_type')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We won't revert this migration as it would be complex
        // and could result in data loss
    }
};
