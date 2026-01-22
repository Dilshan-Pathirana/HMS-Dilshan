<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('hr_policies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('policy_name');
            $table->string('policy_category'); // Leave, Attendance, Salary, Benefits, Conduct, etc.
            $table->text('description');
            $table->text('policy_content')->nullable();
            $table->date('effective_date');
            $table->date('expiry_date')->nullable();
            $table->string('status')->default('Active'); // Active, Inactive, Draft
            $table->string('document_path')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->index('policy_category');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hr_policies');
    }
};
