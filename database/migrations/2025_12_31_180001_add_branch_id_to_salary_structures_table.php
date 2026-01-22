<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add branch_id to salary_structures for branch-specific pay scales
     */
    public function up(): void
    {
        Schema::table('salary_structures', function (Blueprint $table) {
            // Add branch_id - nullable for global/default structures
            $table->uuid('branch_id')->nullable()->after('id');
            
            // Add foreign key
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            
            // Update unique constraint to be per branch
            // Drop existing unique constraint on grade_code
            $table->dropUnique(['grade_code']);
            
            // Add composite unique constraint (grade_code + branch_id)
            // This allows same grade codes across different branches
            $table->unique(['grade_code', 'branch_id'], 'salary_structures_grade_branch_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_structures', function (Blueprint $table) {
            // Drop composite unique
            $table->dropUnique('salary_structures_grade_branch_unique');
            
            // Restore original unique
            $table->unique('grade_code');
            
            // Drop foreign key and column
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
