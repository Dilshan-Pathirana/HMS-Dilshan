<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add missing columns to leave_types table for branch-wise management
     */
    public function up(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            // Add branch support
            if (!Schema::hasColumn('leave_types', 'branch_id')) {
                $table->uuid('branch_id')->nullable()->after('id')->index();
            }

            // Rename annual_quota to default_days if needed
            if (Schema::hasColumn('leave_types', 'annual_quota') && !Schema::hasColumn('leave_types', 'default_days')) {
                $table->renameColumn('annual_quota', 'default_days');
            }

            // Add missing columns
            if (!Schema::hasColumn('leave_types', 'is_paid')) {
                $table->boolean('is_paid')->default(true)->after('default_days');
            }

            if (!Schema::hasColumn('leave_types', 'max_carry_forward_days')) {
                // If max_carry_forward exists, rename it
                if (Schema::hasColumn('leave_types', 'max_carry_forward')) {
                    $table->renameColumn('max_carry_forward', 'max_carry_forward_days');
                } else {
                    $table->integer('max_carry_forward_days')->default(0)->after('carry_forward');
                }
            }

            if (!Schema::hasColumn('leave_types', 'requires_approval')) {
                $table->boolean('requires_approval')->default(true)->after('max_carry_forward_days');
            }

            if (!Schema::hasColumn('leave_types', 'min_days_notice')) {
                $table->integer('min_days_notice')->default(0)->after('requires_approval');
            }

            if (!Schema::hasColumn('leave_types', 'document_type')) {
                $table->string('document_type')->nullable()->after('requires_document');
            }

            if (!Schema::hasColumn('leave_types', 'deduction_rate')) {
                $table->decimal('deduction_rate', 5, 2)->default(0)->after('document_type');
            }

            if (!Schema::hasColumn('leave_types', 'affects_attendance')) {
                $table->boolean('affects_attendance')->default(true)->after('deduction_rate');
            }

            if (!Schema::hasColumn('leave_types', 'color')) {
                $table->string('color', 20)->default('#3B82F6')->after('affects_attendance');
            }

            if (!Schema::hasColumn('leave_types', 'icon')) {
                $table->string('icon', 50)->nullable()->after('color');
            }

            if (!Schema::hasColumn('leave_types', 'sort_order')) {
                $table->integer('sort_order')->default(0)->after('icon');
            }

            if (!Schema::hasColumn('leave_types', 'created_by')) {
                $table->uuid('created_by')->nullable();
            }

            if (!Schema::hasColumn('leave_types', 'updated_by')) {
                $table->uuid('updated_by')->nullable();
            }

            if (!Schema::hasColumn('leave_types', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // SQLite does not support dropping columns directly.
        // Workaround: recreate the table without the added columns if using SQLite.
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            // 1. Rename the existing table
            Schema::rename('leave_types', 'leave_types_old');

            // 2. Recreate the table without the columns added in this migration
            Schema::create('leave_types', function (Blueprint $table) {
                $table->uuid('id')->primary();
                // Add only the original columns that existed before this migration
                // You may need to adjust this list based on your original schema
                $table->string('name');
                $table->integer('annual_quota')->default(0);
                $table->integer('carry_forward')->default(0);
                $table->boolean('requires_document')->default(false);
                $table->timestamps();
            });


            // 3. Copy data from old table to new table (handle annual_quota/default_days rename)
            // Use COALESCE to select default_days if annual_quota does not exist
            $columns = \DB::getSchemaBuilder()->getColumnListing('leave_types_old');
            $annualQuotaCol = in_array('annual_quota', $columns) ? 'annual_quota' : (in_array('default_days', $columns) ? 'default_days' : '0');
            $sql = "INSERT INTO leave_types (id, name, annual_quota, carry_forward, requires_document, created_at, updated_at) SELECT id, name, $annualQuotaCol, carry_forward, requires_document, created_at, updated_at FROM leave_types_old";
            \DB::statement($sql);

            // 4. Drop the old table
            Schema::drop('leave_types_old');
        } else {
            Schema::table('leave_types', function (Blueprint $table) {
                $table->dropColumn([
                    'branch_id',
                    'is_paid',
                    'requires_approval',
                    'min_days_notice',
                    'document_type',
                    'deduction_rate',
                    'affects_attendance',
                    'color',
                    'icon',
                    'sort_order',
                    'created_by',
                    'updated_by',
                    'deleted_at'
                ]);
            });
        }
    }
};
